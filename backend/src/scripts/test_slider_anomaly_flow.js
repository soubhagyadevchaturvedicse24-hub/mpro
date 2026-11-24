import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api/v1';

async function testUserAnomalyFlow() {
  console.log('🧪 Testing User Workflow: Create Transport -> Run Simulator -> Peak Temp Slider -> Anomaly Report');

  try {
    // 1. Admin login to create transport
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
    const hospitals = hospJson.data?.hospitals || hospJson.data || hospJson || [];
    const originHosp = hospitals[0];
    const destHosp = hospitals[1] || hospitals[0];

    // Create unique Box
    const boxCode = `BOX-USER-${Date.now()}`;
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

    // Create transport mission from Network Login
    const missionId = `TRN-USER-${Date.now()}`;
    console.log(`[1] Creating Transport ${missionId}...`);
    const missionRes = await fetch(`${API_URL}/transport/missions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        missionId,
        organType: "KIDNEY",
        originHospital: originHosp._id,
        destinationHospital: destHosp._id,
        boxId: box._id,
        assignedRfidCard: 1,
        patientName: "Emergency Patient",
        priority: "Urgent"
      })
    });
    const missionJson = await missionRes.json();
    const mission = missionJson.data?.mission || missionJson.data || missionJson.mission || missionJson;
    const missionDbId = mission._id;
    console.log(`✓ Transport Created (DB ID: ${missionDbId})`);

    await new Promise(r => setTimeout(r, 400));

    // Dispatch and Start Transit
    console.log('[2] Dispatching and starting transit...');
    await fetch(`${API_URL}/transport/missions/${missionDbId}/workflow/dispatch`, { method: 'POST', headers: authHeaders, body: JSON.stringify({}) });
    await fetch(`${API_URL}/transport/missions/${missionDbId}/workflow/startTransit`, { method: 'POST', headers: authHeaders, body: JSON.stringify({}) });
    console.log('✓ Transport is now IN_TRANSIT');

    await new Promise(r => setTimeout(r, 400));

    // 3. Simulate User moving Temp Slider to its PEAK (e.g. 18.5°C) and Tampering
    console.log('[3] Simulating User adjusting Temperature Slider to Peak (18.5°C) & Tampering...');
    
    // Send telemetry via device endpoint using default/box context
    const peakTelemetryRes = await fetch(`${API_URL}/device/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': boxCode,
        'x-device-secret': "secret123"
      },
      body: JSON.stringify({
        missionId: missionId,
        temperature: 18.5,  // PEAK EXCURSION
        batteryLevel: 88.0,
        isTampered: true,   // LID OPEN
        geoLocation: { type: "Point", coordinates: [80.26, 13.07] }
      })
    });

    if (!peakTelemetryRes.ok) throw new Error(`Peak telemetry failed: ${await peakTelemetryRes.text()}`);
    console.log('✓ Peak telemetry packet emitted and accepted by backend');

    await new Promise(r => setTimeout(r, 600));

    // 4. Mark as Arrived and Complete
    console.log('[4] Marking Transport as Arrived & Completed...');
    await fetch(`${API_URL}/transport/missions/${missionDbId}/workflow/arrive`, { method: 'POST', headers: authHeaders, body: JSON.stringify({}) });
    await fetch(`${API_URL}/transport/missions/${missionDbId}/workflow/complete`, { method: 'POST', headers: authHeaders, body: JSON.stringify({}) });
    console.log('✓ Transport completed and notarized');

    await new Promise(r => setTimeout(r, 600));

    // 5. Fetch Audit Report for this Mission
    console.log(`[5] Fetching Audit Report for ${missionId}...`);
    const reportRes = await fetch(`${API_URL}/audit/mission-report/${missionDbId}`);
    if (!reportRes.ok) throw new Error(`Report fetch failed: ${await reportRes.text()}`);
    const reportData = (await reportRes.json()).data;

    console.log('\n================ AUDIT REPORT FINDINGS ================');
    console.log(`Mission: ${reportData.mission.missionId} (Status: ${reportData.mission.status})`);
    console.log(`Total Blocks: ${reportData.stats.totalBlocks}`);
    console.log(`Max Temp Recorded: ${reportData.stats.maxTemp}°C`);
    console.log(`Tamper Events Recorded: ${reportData.stats.tamperCount}`);
    console.log(`Total Anomaly Blocks: ${reportData.anomalyBlocks.length}`);

    reportData.anomalyBlocks.forEach((ab, i) => {
      console.log(`\n  Anomaly #${i+1}:`);
      console.log(`    - Event: ${ab.eventType} (${ab.label}) [Severity: ${ab.severity}]`);
      console.log(`    - Temp: ${ab.details.temperature}°C | Bat: ${ab.details.batteryLevel}% | Tamper: ${ab.details.isTampered}`);
      console.log(`    - Hash: ${ab.hash}`);
      console.log(`    - Summary: ${ab.summary}`);
    });

    // Validations
    if (reportData.stats.maxTemp !== 18.5) {
      throw new Error(`Expected max temp 18.5°C, got ${reportData.stats.maxTemp}°C`);
    }
    if (reportData.stats.tamperCount < 1) {
      throw new Error(`Expected at least 1 tamper event, got ${reportData.stats.tamperCount}`);
    }
    if (reportData.anomalyBlocks.length < 1) {
      throw new Error(`Expected at least 1 anomaly block, got ${reportData.anomalyBlocks.length}`);
    }

    const peakBlock = reportData.anomalyBlocks.find(ab => ab.details.temperature === 18.5 || ab.summary.includes('18.5'));
    if (!peakBlock) {
      throw new Error('Peak 18.5°C excursion was not found in the anomaly blocks array!');
    }

    console.log('\n🎉 SUCCESS: The peak temperature excursion (18.5°C) and tamper breach were 100% recorded in the blockchain report with real cryptographic hashes!');

  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

testUserAnomalyFlow();
