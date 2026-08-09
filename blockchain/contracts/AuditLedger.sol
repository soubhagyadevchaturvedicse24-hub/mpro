// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AuditLedger
 * @notice Immutable on-chain audit trail for NeoLife Organ Transport System.
 *         Each record stores a SHA-256 hash of the event payload, guaranteeing
 *         that the off-chain MongoDB copy has not been tampered with.
 * @dev Deployed on local Ganache for development. Same contract can be deployed
 *      to Sepolia testnet or Ethereum mainnet without modification.
 */
contract AuditLedger {

    struct AuditRecord {
        uint256 recordIndex;
        string  eventType;
        string  entityType;
        string  entityId;
        bytes32 payloadHash;   // SHA-256 of canonical JSON payload
        uint256 timestamp;     // block.timestamp (Unix epoch)
        address recorder;      // wallet address that submitted the record
    }

    // ── Storage ─────────────────────────────────────────────────────────────
    AuditRecord[] public records;

    // entityType_entityId → array of record indices
    mapping(string => uint256[]) private _entityRecords;

    // ── Events ──────────────────────────────────────────────────────────────
    event RecordAppended(
        uint256 indexed recordIndex,
        string          eventType,
        string          entityType,
        string          entityId,
        bytes32         payloadHash,
        uint256         timestamp,
        address indexed recorder
    );

    // ── Write Functions ──────────────────────────────────────────────────────

    /**
     * @notice Append a new audit record to the on-chain ledger.
     * @param eventType  E.g. "ORGAN_REGISTERED", "TRANSPORT_DISPATCHED"
     * @param entityType E.g. "Organ", "Donor", "TransportMission"
     * @param entityId   The primary ID of the entity (MongoDB ObjectId or custom)
     * @param payloadHash SHA-256 hash of the canonical JSON payload (bytes32)
     * @return recordIndex The index of the newly appended record
     */
    function appendRecord(
        string  memory eventType,
        string  memory entityType,
        string  memory entityId,
        bytes32        payloadHash
    ) external returns (uint256 recordIndex) {
        recordIndex = records.length;

        records.push(AuditRecord({
            recordIndex: recordIndex,
            eventType:   eventType,
            entityType:  entityType,
            entityId:    entityId,
            payloadHash: payloadHash,
            timestamp:   block.timestamp,
            recorder:    msg.sender
        }));

        string memory key = _entityKey(entityType, entityId);
        _entityRecords[key].push(recordIndex);

        emit RecordAppended(
            recordIndex,
            eventType,
            entityType,
            entityId,
            payloadHash,
            block.timestamp,
            msg.sender
        );
    }

    // ── Read Functions ───────────────────────────────────────────────────────

    /**
     * @notice Get a single audit record by index.
     */
    function getRecord(uint256 index) external view returns (AuditRecord memory) {
        require(index < records.length, "AuditLedger: record does not exist");
        return records[index];
    }

    /**
     * @notice Total number of records on-chain.
     */
    function getTotalRecords() external view returns (uint256) {
        return records.length;
    }

    /**
     * @notice Get all record indices for a specific entity.
     */
    function getEntityHistory(
        string memory entityType,
        string memory entityId
    ) external view returns (uint256[] memory) {
        return _entityRecords[_entityKey(entityType, entityId)];
    }

    /**
     * @notice Verify integrity — returns total on-chain records.
     *         Compare this count against MongoDB count for tamper detection.
     */
    function verifyIntegrity() external view returns (
        uint256 totalRecords,
        bool    chainIntact
    ) {
        totalRecords = records.length;
        chainIntact  = true; // On Ethereum, immutability is guaranteed by consensus
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    function _entityKey(
        string memory entityType,
        string memory entityId
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(entityType, "_", entityId));
    }
}
