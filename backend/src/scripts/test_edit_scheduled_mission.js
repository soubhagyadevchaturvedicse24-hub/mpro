import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api/v1';

async function testEditScheduledMission() {
  console.log('🧪 Testing Scheduled Mission Edit (Kidney -> Liver) and End-to-End Audit Report...');

  try {
    // 1. Admin login
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@platform.com', password: 'admin123admin' })
    });
    const loginData = await loginRes.json();
    const adminToken = loginData.data.accessToken;

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    };

    // Get hospitals
    const hospRes = await fetch(`${API_URL}/hospitals`, { headers: authHeaders });
    const hospJson = await hospRes.json();
    const hospitals = hospJson.data?.hospitals || hospJson.data || [];
    const originHosp = hospitals[0];
    const destHosp = hospitals[1] || hospitals[0];

    // Create unique Box
    const boxCode = `BOX-EDIT-${Date.now()}`;
    const boxRes = await fetch(`${API_URL}/transport/boxes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        boxId: boxCode,
        deviceId: boxCode,
        deviceSecret: "secret123",
        lastKnownLocation: { type: "Point", coordinates: [80.25, 13.06] }
      })
    });
    const boxJson = await boxRes.json();
    const box = boxJson.data || boxJson;

    // 1. Create scheduled mission with Kidney
    const missionId = `TRN-EDIT-${Date.now()}`;
    console.log(`[1] Creating Initial Transport as "Kidney": ${missionId}...`);
    const createRes = await fetch(`${API_URL}/transport/missions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        missionId,
        organType: "Kidney",
        transportType: "Organ Transport",
        originHospital: originHosp._id,
        destinationHospital: destHosp._id,
        boxId: box._id,
        assignedRfidCard: 1,
        patientName: "John Doe",
        priority: "High"
      })
    });

    const createJson = await createRes.json();
    const createdMission = createJson.data?.mission || createJson.data;
    console.log(`✓ Created: DB organType = "${createdMission.organType}"`);

    // 2. User edits the scheduled mission to "Liver"
    console.log(`[2] User opens Scheduled Details Modal and changes organ to "Liver"...`);
    const editRes = await fetch(`${API_URL}/transport/missions/${createdMission._id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        organType: "Liver",
        patientName: "Jane Doe (Edited)",
        priority: "Critical"
      })
    });

    const editJson = await editRes.json();
    const editedMission = editJson.data?.mission || editJson.data;
    console.log(`✓ PATCH Successful: DB organType is now "${editedMission.organType}" (patient: "${editedMission.patientName}")`);

    if (editedMission.organType !== 'Liver') {
      throw new Error(`Expected organType to be 'Liver' after edit, got '${editedMission.organType}'`);
    }

    // 3. Complete transit workflow
    console.log(`[3] Advancing Workflow to In-Transit and Completed...`);
    await fetch(`${API_URL}/transport/missions/${createdMission._id}/workflow/dispatch`, { method: 'POST', headers: authHeaders, body: JSON.stringify({}) });
    await fetch(`${API_URL}/transport/missions/${createdMission._id}/workflow/startTransit`, { method: 'POST', headers: authHeaders, body: JSON.stringify({}) });
    await fetch(`${API_URL}/transport/missions/${createdMission._id}/workflow/arrive`, { method: 'POST', headers: authHeaders, body: JSON.stringify({}) });
    await fetch(`${API_URL}/transport/missions/${createdMission._id}/workflow/complete`, { method: 'POST', headers: authHeaders, body: JSON.stringify({}) });

    // 4. Fetch the final Completed Audit Report
    console.log(`[4] Fetching Final Completed Audit Report...`);
    const reportRes = await fetch(`${API_URL}/audit/mission-report/${createdMission._id}`);
    const reportData = (await reportRes.json()).data;

    console.log('\n--- Final Audit Report Summary ---');
    console.log('Mission ID:', reportData.mission.missionId);
    console.log('Organ Type:', reportData.mission.organType);
    console.log('Patient Name:', reportData.mission.patientName);
    console.log('Status:', reportData.mission.status);

    if (reportData.mission.organType !== 'Liver') {
      throw new Error(`Expected audit report organType to be 'Liver', got '${reportData.mission.organType}'`);
    }

    console.log('\n🎉 ALL CHECKS PASSED: Editing scheduled mission from Kidney -> Liver persists cleanly to Database and reflects in the Final Audit Report!');

  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

testEditScheduledMission();
