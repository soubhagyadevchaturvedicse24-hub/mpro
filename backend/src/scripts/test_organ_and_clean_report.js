import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api/v1';

async function testOrganPersistenceAndReport() {
  console.log('🧪 Testing Organ Type Persistence and Clean Audit Report (No Distance/Duration)...');

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
    const boxCode = `BOX-HEART-${Date.now()}`;
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

    // Test creating a HEART transport
    const heartMissionId = `TRN-HEART-${Date.now()}`;
    console.log(`[1] Creating HEART Transport: ${heartMissionId}...`);
    const createRes = await fetch(`${API_URL}/transport/missions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        missionId: heartMissionId,
        organType: "Heart",
        transportType: "Organ Transport",
        originHospital: originHosp._id,
        destinationHospital: destHosp._id,
        boxId: box._id,
        assignedRfidCard: 2,
        patientName: "Heart Recipient",
        priority: "Critical"
      })
    });

    const createJson = await createRes.json();
    const createdMission = createJson.data?.mission || createJson.data;
    console.log(`✓ Mission Created in DB with organType: "${createdMission.organType}"`);

    if (createdMission.organType !== 'Heart') {
      throw new Error(`Expected organType 'Heart', got '${createdMission.organType}'`);
    }

    // Step through workflow
    await fetch(`${API_URL}/transport/missions/${createdMission._id}/workflow/dispatch`, { method: 'POST', headers: authHeaders, body: JSON.stringify({}) });
    await fetch(`${API_URL}/transport/missions/${createdMission._id}/workflow/startTransit`, { method: 'POST', headers: authHeaders, body: JSON.stringify({}) });
    await fetch(`${API_URL}/transport/missions/${createdMission._id}/workflow/arrive`, { method: 'POST', headers: authHeaders, body: JSON.stringify({}) });
    await fetch(`${API_URL}/transport/missions/${createdMission._id}/workflow/complete`, { method: 'POST', headers: authHeaders, body: JSON.stringify({}) });

    // Fetch audit report
    console.log(`[2] Fetching Audit Report for ${heartMissionId}...`);
    const reportRes = await fetch(`${API_URL}/audit/mission-report/${createdMission._id}`);
    const reportData = (await reportRes.json()).data;

    console.log('\n--- Mission Audit Report Metadata ---');
    console.log('ID:', reportData.mission.missionId);
    console.log('Organ Type:', reportData.mission.organType);
    console.log('Transport Category:', reportData.mission.transportType);
    console.log('Origin:', reportData.mission.origin);
    console.log('Destination:', reportData.mission.destination);

    if (reportData.mission.organType !== 'Heart') {
      throw new Error(`Expected audit report mission.organType to be 'Heart', got '${reportData.mission.organType}'`);
    }

    console.log('\n🎉 SUCCESS: Organ Type is accurately persisted and displayed as Heart (not defaulting to Kidney)!');

  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

testOrganPersistenceAndReport();
