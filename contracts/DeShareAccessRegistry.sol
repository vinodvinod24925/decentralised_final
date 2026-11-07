// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DeShareAccessRegistry
 * @notice On-chain Access Control, File Registration, PRE Delegation, and Security Audit Registry for DeShare
 */
contract DeShareAccessRegistry {
    // Contract owner
    address public owner;
    uint256 public constant MAX_DELEGATION_DEPTH = 3;

    struct FileRecord {
        string fileId;
        string currentCid;
        address fileOwner;
        string fileName;
        uint256 fileSize;
        uint256 version;
        uint256 registeredAt;
        bool exists;
    }

    struct AccessGrant {
        address recipient;
        uint256 expiryTimestamp; // Unix timestamp enforced via block.timestamp
        uint256 delegationDepth;
        bool isRevoked;
        bool exists;
    }

    // Mapping: fileId => FileRecord
    mapping(string => FileRecord) private files;

    // Mapping: fileId => recipient address => AccessGrant
    mapping(string => mapping(address => AccessGrant)) private directGrants;

    // Mapping: fileId => groupId => bool (group-level access permission)
    mapping(string => mapping(string => bool)) private groupGrants;

    // Events
    event FileRegistered(string indexed fileId, string cid, address indexed fileOwner, string fileName, uint256 version, uint256 timestamp);
    event AccessGranted(string indexed fileId, address indexed recipient, uint256 expiryTimestamp, uint256 delegationDepth, uint256 timestamp);
    event GroupAccessGranted(string indexed fileId, string indexed groupId, uint256 timestamp);
    event AccessRevoked(string indexed fileId, address indexed recipient, uint256 timestamp);
    event GroupAccessRevoked(string indexed fileId, string indexed groupId, uint256 timestamp);
    event UnauthorizedAccessDetected(string indexed fileId, address indexed attacker, string reason, uint256 timestamp);
    event FileRotated(string indexed fileId, string oldCid, string newCid, uint256 newVersion, uint256 timestamp);

    modifier onlyFileOwner(string memory fileId) {
        require(files[fileId].exists, "DeShare: File does not exist");
        require(files[fileId].fileOwner == msg.sender, "DeShare: Caller is not file owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Register a newly encrypted file on-chain
     */
    function registerFile(
        string memory fileId,
        string memory cid,
        string memory fileName,
        uint256 fileSize
    ) external {
        require(!files[fileId].exists, "DeShare: File ID already registered");
        require(bytes(cid).length > 0, "DeShare: CID cannot be empty");

        files[fileId] = FileRecord({
            fileId: fileId,
            currentCid: cid,
            fileOwner: msg.sender,
            fileName: fileName,
            fileSize: fileSize,
            version: 1,
            registeredAt: block.timestamp,
            exists: true
        });

        emit FileRegistered(fileId, cid, msg.sender, fileName, 1, block.timestamp);
    }

    /**
     * @notice Grant file access to a recipient with expiry and delegation depth
     */
    function grantAccess(
        string memory fileId,
        address recipient,
        uint256 expiryTimestamp,
        uint256 delegationDepth
    ) external onlyFileOwner(fileId) {
        require(recipient != address(0), "DeShare: Invalid recipient address");
        require(expiryTimestamp > block.timestamp, "DeShare: Expiry must be in the future");
        require(delegationDepth <= MAX_DELEGATION_DEPTH, "DeShare: Delegation depth exceeds limit 3");

        AccessGrant memory existing = directGrants[fileId][recipient];
        require(!existing.exists || existing.isRevoked || existing.expiryTimestamp < block.timestamp, "DeShare: Active grant already exists");

        directGrants[fileId][recipient] = AccessGrant({
            recipient: recipient,
            expiryTimestamp: expiryTimestamp,
            delegationDepth: delegationDepth,
            isRevoked: false,
            exists: true
        });

        emit AccessGranted(fileId, recipient, expiryTimestamp, delegationDepth, block.timestamp);
    }

    /**
     * @notice Grant file access to an authorized group
     */
    function grantGroupAccess(string memory fileId, string memory groupId) external onlyFileOwner(fileId) {
        groupGrants[fileId][groupId] = true;
        emit GroupAccessGranted(fileId, groupId, block.timestamp);
    }

    /**
     * @notice Revoke direct file access from a recipient
     */
    function revokeAccess(string memory fileId, address recipient) external onlyFileOwner(fileId) {
        require(directGrants[fileId][recipient].exists, "DeShare: Grant does not exist");
        require(!directGrants[fileId][recipient].isRevoked, "DeShare: Grant already revoked");

        directGrants[fileId][recipient].isRevoked = true;
        emit AccessRevoked(fileId, recipient, block.timestamp);
    }

    /**
     * @notice Revoke group file access
     */
    function revokeGroupAccess(string memory fileId, string memory groupId) external onlyFileOwner(fileId) {
        groupGrants[fileId][groupId] = false;
        emit GroupAccessRevoked(fileId, groupId, block.timestamp);
    }

    /**
     * @notice Rotates file encryption and sets new CID upon security incidents
     */
    function rotateFile(
        string memory fileId,
        string memory newCid
    ) external onlyFileOwner(fileId) {
        FileRecord storage record = files[fileId];
        string memory oldCid = record.currentCid;
        record.currentCid = newCid;
        record.version += 1;

        emit FileRotated(fileId, oldCid, newCid, record.version, block.timestamp);
    }

    /**
     * @notice Audit log for unauthorized access detection
     */
    function recordUnauthorizedAttempt(string memory fileId, address attacker, string memory reason) external {
        emit UnauthorizedAccessDetected(fileId, attacker, reason, block.timestamp);
    }

    /**
     * @notice Verify whether a user is authorized on-chain (enforcing block.timestamp <= expiry)
     */
    function isAccessAllowed(string memory fileId, address user) external view returns (bool, string memory) {
        if (!files[fileId].exists) {
            return (false, "FILE_NOT_FOUND");
        }

        // Owner always has access
        if (files[fileId].fileOwner == user) {
            return (true, "OWNER_ACCESS");
        }

        AccessGrant memory grant = directGrants[fileId][user];
        if (!grant.exists) {
            return (false, "NO_ACTIVE_GRANT");
        }

        if (grant.isRevoked) {
            return (false, "GRANT_REVOKED");
        }

        if (block.timestamp > grant.expiryTimestamp) {
            return (false, "GRANT_EXPIRED");
        }

        return (true, "AUTHORIZED");
    }

    /**
     * @notice Check group grant state
     */
    function isGroupAccessAllowed(string memory fileId, string memory groupId) external view returns (bool) {
        return groupGrants[fileId][groupId];
    }

    /**
     * @notice Query file metadata
     */
    function getFile(string memory fileId) external view returns (
        string memory currentCid,
        address fileOwner,
        string memory fileName,
        uint256 fileSize,
        uint256 version,
        uint256 registeredAt
    ) {
        require(files[fileId].exists, "DeShare: File does not exist");
        FileRecord memory f = files[fileId];
        return (f.currentCid, f.fileOwner, f.fileName, f.fileSize, f.version, f.registeredAt);
    }
}
