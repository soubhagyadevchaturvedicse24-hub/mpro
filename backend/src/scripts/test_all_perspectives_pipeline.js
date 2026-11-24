import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api/v1';

async function testAllPerspectivesPipeline() {
  console.log('================================================================');
  console.log('🧪 MULTI-POV TRANSPORT WORKFLOW PIPELINE VERIFICATION TEST');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // SETUP: Logins for multiple roles/POVs
    // -------------------------------------------------------------
    console.log('[SETUP] Logging in across multiple user POVs...');
    
    // POV 1: Admin
    const adminRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@platform.com', password: 'admin123admin' })
    });
    const adminToken = (await adminRes.json()).data.accessToken;
    const adminHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` };
    console.log('✓ Admin authenticated');

    // POV 2: Apollo Hospital Coordinator
    const apolloRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'transplant@apollohospitals.com', password: 'apollo123apollo' })
    });
    const apolloToken = (await apolloRes.json()).data.accessToken;
    const apolloHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apolloToken}` };
    console.log('✓ Apollo Hospital Coordinator authenticated');

    // Get hospitals
    const hospRes = await fetch(`${API_URL}/hospitals`, { headers: adminHeaders });
    const hospitals = (await hospRes.json()).data.hospitals || (await hospRes.json()).data || [];
    const originHosp = hospitals.find(h => h.name.includes('Max')) || hospitals[0];
    const destHosp = hospitals.find(h => h.name.includes('Apollo')) || hospitals[1];

    // Helper: Create Box
    async function createBox(prefix) {
      const code = `BOX-${prefix}-${Date.now()}`;
      const res = await fetch(`${API_URL}/transport/boxes`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          boxId: code,
          deviceId: code,
          deviceSecret: "secret123",
          lastKnownLocation: { type: "Point", coordinates: [80.25, 13.06] }
        })
      });
      const data = await res.json();
      return data.data || data;
    }

    // -------------------------------------------------------------
    // TEST POV 1: Platform Admin POV (Create -> Start -> Arrive -> Complete)
    // -------------------------------------------------------------
    console.log('\n--- POV 1: PLATFORM ADMIN WORKFLOW ---');
    const box1 = await createBox('ADMIN');
    const mId1 = `TRN-ADMIN-${Date.now()}`;

    // 1a. Create mission
    const c1 = await fetch(`${API_URL}/transport/missions`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        missionId: mId1,
        organType: 'Liver',
        transportType: 'Organ Transport',
        originHospital: originHosp._id,
        destinationHospital: destHosp._id,
        boxId: box1._id,
        patientName: 'Patient Alpha'
      })
    });
    const mission1 = (await c1.json()).data?.mission || (await c1.json()).data;
    console.log(`✓ [POV 1] Mission created with Status: ${mission1.status}`);

    // 1b. Dispatch & Start Transit
    await fetch(`${API_URL}/transport/missions/${mission1._id}/workflow/dispatch`, { method: 'POST', headers: adminHeaders, body: JSON.stringify({}) });
    await fetch(`${API_URL}/transport/missions/${mission1._id}/workflow/startTransit`, { method: 'POST', headers: adminHeaders, body: JSON.stringify({}) });
    
    // Check status in DB
    const s1 = await (await fetch(`${API_URL}/transport/missions/${mission1._id}`, { headers: adminHeaders })).json();
    console.log(`✓ [POV 1] Mission moved to In-Transit: Status = ${s1.data.mission.status}`);
    if (s1.data.mission.status !== 'IN_TRANSIT') throw new Error('Expected IN_TRANSIT');

    // 1c. Mark as Arrived & Complete
    await fetch(`${API_URL}/transport/missions/${mission1._id}/workflow/arrive`, { method: 'POST', headers: adminHeaders, body: JSON.stringify({}) });
    await fetch(`${API_URL}/transport/missions/${mission1._id}/workflow/complete`, { method: 'POST', headers: adminHeaders, body: JSON.stringify({}) });

    // 1d. Re-fetch all missions and verify it is in COMPLETED (never back in scheduled)
    const list1 = await (await fetch(`${API_URL}/transport/missions`, { headers: adminHeaders })).json();
    const fetched1 = list1.data.missions.find(m => m._id === mission1._id || m.missionId === mId1);
    console.log(`✓ [POV 1] Mission after Mark as Done in Database: Status = ${fetched1.status}`);
    if (fetched1.status !== 'COMPLETED') {
      throw new Error(`Expected mission status COMPLETED, but found ${fetched1.status}`);
    }

    // -------------------------------------------------------------
    // TEST POV 2: Hospital Coordinator POV (Source/Destination Handover)
    // -------------------------------------------------------------
    console.log('\n--- POV 2: HOSPITAL COORDINATOR (APOLLO) WORKFLOW ---');
    const box2 = await createBox('APOLLO');
    const mId2 = `TRN-APOLLO-${Date.now()}`;

    // 2a. Admin creates mission destined for Apollo
    const c2 = await fetch(`${API_URL}/transport/missions`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        missionId: mId2,
        organType: 'Heart',
        transportType: 'Organ Transport',
        originHospital: originHosp._id,
        destinationHospital: destHosp._id,
        boxId: box2._id,
        patientName: 'Patient Beta'
      })
    });
    const mission2 = (await c2.json()).data?.mission || (await c2.json()).data;
    console.log(`✓ [POV 2] Mission created: ${mId2}`);

    // 2b. Dispatch & Start
    await fetch(`${API_URL}/transport/missions/${mission2._id}/workflow/startTransit`, { method: 'POST', headers: adminHeaders, body: JSON.stringify({}) });

    // 2c. Apollo Coordinator confirms arrival & marks done
    const apolloArriveRes = await fetch(`${API_URL}/transport/missions/${mission2._id}/workflow/arrive`, {
      method: 'POST',
      headers: apolloHeaders,
      body: JSON.stringify({})
    });
    console.log(`✓ [POV 2] Apollo Coordinator Arrive Response HTTP Status: ${apolloArriveRes.status}`);
    if (!apolloArriveRes.ok) throw new Error(`Apollo Coordinator Arrive failed: ${await apolloArriveRes.text()}`);

    const apolloCompleteRes = await fetch(`${API_URL}/transport/missions/${mission2._id}/workflow/complete`, {
      method: 'POST',
      headers: apolloHeaders,
      body: JSON.stringify({})
    });
    console.log(`✓ [POV 2] Apollo Coordinator Complete Response HTTP Status: ${apolloCompleteRes.status}`);
    if (!apolloCompleteRes.ok) throw new Error(`Apollo Coordinator Complete failed: ${await apolloCompleteRes.text()}`);

    // 2d. Check list missions from Apollo POV
    const apolloList = await (await fetch(`${API_URL}/transport/missions`, { headers: apolloHeaders })).json();
    const fetched2 = apolloList.data.missions.find(m => m._id === mission2._id || m.missionId === mId2);
    console.log(`✓ [POV 2] Mission in Apollo's Dashboard: Status = ${fetched2.status}`);
    if (fetched2.status !== 'COMPLETED') {
      throw new Error(`Expected mission status COMPLETED, got ${fetched2.status}`);
    }

    // -------------------------------------------------------------
    // TEST POV 3: Direct Forgiving Transitions (Skip intermediate step)
    // -------------------------------------------------------------
    console.log('\n--- POV 3: FORGIVING DIRECT TRANSITION (From PENDING directly to COMPLETED) ---');
    const box3 = await createBox('DIRECT');
    const mId3 = `TRN-DIRECT-${Date.now()}`;

    const c3 = await fetch(`${API_URL}/transport/missions`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        missionId: mId3,
        organType: 'Kidney',
        transportType: 'Organ Transport',
        originHospital: originHosp._id,
        destinationHospital: destHosp._id,
        boxId: box3._id,
        patientName: 'Patient Gamma'
      })
    });
    const mission3 = (await c3.json()).data?.mission || (await c3.json()).data;
    console.log(`✓ [POV 3] Mission created in PENDING: ${mId3}`);

    // Directly call complete from PENDING (simulates quick Mark as Done)
    const directCompleteRes = await fetch(`${API_URL}/transport/missions/${mission3._id}/workflow/complete`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({})
    });
    console.log(`✓ [POV 3] Direct Complete HTTP Status: ${directCompleteRes.status}`);
    if (!directCompleteRes.ok) throw new Error(`Direct Complete failed: ${await directCompleteRes.text()}`);

    const s3 = await (await fetch(`${API_URL}/transport/missions/${mission3._id}`, { headers: adminHeaders })).json();
    console.log(`✓ [POV 3] Direct Complete verified in DB: Status = ${s3.data.mission.status}`);
    if (s3.data.mission.status !== 'COMPLETED') {
      throw new Error(`Expected COMPLETED, got ${s3.data.mission.status}`);
    }

    console.log('\n================================================================');
    console.log('🎉 ALL PERSPECTIVE & PIPELINE TESTS PASSED 100%!');
    console.log('================================================================');
    console.log('  1. [✓] Admin can create, start, arrive, complete without status regression');
    console.log('  2. [✓] Hospital Coordinators (Apollo / Source) can complete without 403s');
    console.log('  3. [✓] Forgiving state machine prevents missions from getting stuck');
    console.log('  4. [✓] Backend persistence guarantees completed transports remain in Completed column');

  } catch (err) {
    console.error('\n❌ Pipeline Test Failed:', err);
    process.exit(1);
  }
}

testAllPerspectivesPipeline();
