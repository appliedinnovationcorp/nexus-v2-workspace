/**
 * Encryption Manager - Advanced Security Framework
 * Handles end-to-end encryption, key management, and cryptographic operations
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class EncryptionManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      algorithm: config.algorithm || 'aes-256-gcm',
      keyDerivation: config.keyDerivation || 'pbkdf2',
      keyLength: config.keyLength || 32,
      ivLength: config.ivLength || 16,
      tagLength: config.tagLength || 16,
      saltLength: config.saltLength || 32,
      iterations: config.iterations || 100000,
      keyRotationInterval: config.keyRotationInterval || 30 * 24 * 60 * 60 * 1000, // 30 days
      enableKeyRotation: config.enableKeyRotation !== false,
      enableHSM: config.enableHSM || false,
      keyStorePath: config.keyStorePath || './keys',
      masterKeyId: config.masterKeyId || 'master-key-001',
      enableQuantumResistant: config.enableQuantumResistant || false,
      ...config
    };
    
    this.keys = new Map();
    this.keyHistory = new Map();
    this.encryptionMetrics = {
      operationsCount: 0,
      bytesEncrypted: 0,
      bytesDecrypted: 0,
      keyRotations: 0,
      errors: 0
    };
    
    this.algorithms = {
      'aes-256-gcm': { keyLength: 32, ivLength: 16, tagLength: 16 },
      'aes-256-cbc': { keyLength: 32, ivLength: 16, tagLength: 0 },
      'chacha20-poly1305': { keyLength: 32, ivLength: 12, tagLength: 16 },
      'aes-256-xts': { keyLength: 64, ivLength: 16, tagLength: 0 }
    };
  }

  /**
   * Initialize the encryption manager
   */
  async initialize() {
    try {
      // Ensure key store directory exists
      await this.ensureKeyStoreDirectory();
      
      // Load or generate master key
      await this.initializeMasterKey();
      
      // Load existing keys
      await this.loadKeys();
      
      // Setup key rotation if enabled
      if (this.config.enableKeyRotation) {
        this.setupKeyRotation();
      }
      
      // Setup HSM if enabled
      if (this.config.enableHSM) {
        await this.initializeHSM();
      }
      
      this.emit('initialized', { 
        timestamp: new Date().toISOString(),
        algorithm: this.config.algorithm,
        keyCount: this.keys.size
      });
      
    } catch (error) {
      this.emit('error', {
        type: 'INITIALIZATION_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Ensure key store directory exists
   */
  async ensureKeyStoreDirectory() {
    try {
      await fs.access(this.config.keyStorePath);
    } catch {
      await fs.mkdir(this.config.keyStorePath, { recursive: true, mode: 0o700 });
    }
  }

  /**
   * Initialize master key
   */
  async initializeMasterKey() {
    const masterKeyPath = path.join(this.config.keyStorePath, `${this.config.masterKeyId}.key`);
    
    try {
      // Try to load existing master key
      const keyData = await fs.readFile(masterKeyPath);
      const masterKey = JSON.parse(keyData.toString());
      this.keys.set(this.config.masterKeyId, masterKey);
    } catch {
      // Generate new master key
      const masterKey = await this.generateKey(this.config.masterKeyId, {
        purpose: 'master',
        algorithm: this.config.algorithm
      });
      
      await this.saveKey(masterKey);
      this.keys.set(this.config.masterKeyId, masterKey);
    }
  }

  /**
   * Load existing keys from key store
   */
  async loadKeys() {
    try {
      const files = await fs.readdir(this.config.keyStorePath);
      const keyFiles = files.filter(file => file.endsWith('.key'));
      
      for (const file of keyFiles) {
        const keyPath = path.join(this.config.keyStorePath, file);
        const keyData = await fs.readFile(keyPath);
        const key = JSON.parse(keyData.toString());
        
        if (key.id !== this.config.masterKeyId) {
          this.keys.set(key.id, key);
        }
      }
    } catch (error) {
      console.warn('Error loading keys:', error.message);
    }
  }

  /**
   * Generate a new encryption key
   */
  async generateKey(keyId, options = {}) {
    const algorithm = options.algorithm || this.config.algorithm;
    const algConfig = this.algorithms[algorithm];
    
    if (!algConfig) {
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
    
    const key = {
      id: keyId || crypto.randomUUID(),
      algorithm,
      key: crypto.randomBytes(algConfig.keyLength),
      purpose: options.purpose || 'data',
      createdAt: new Date(),
      expiresAt: options.expiresAt || new Date(Date.now() + this.config.keyRotationInterval),
      version: 1,
      status: 'active',
      metadata: options.metadata || {}
    };
    
    this.keys.set(key.id, key);
    await this.saveKey(key);
    
    this.emit('keyGenerated', {
      keyId: key.id,
      algorithm: key.algorithm,
      purpose: key.purpose,
      timestamp: new Date().toISOString()
    });
    
    return key;
  }

  /**
   * Encrypt data
   */
  async encrypt(data, keyId = null, options = {}) {
    try {
      const startTime = Date.now();
      
      // Get encryption key
      const key = keyId ? this.keys.get(keyId) : this.keys.get(this.config.masterKeyId);
      if (!key) {
        throw new Error('Encryption key not found');
      }
      
      if (key.status !== 'active') {
        throw new Error('Key is not active');
      }
      
      const algorithm = key.algorithm;
      const algConfig = this.algorithms[algorithm];
      
      // Generate IV
      const iv = crypto.randomBytes(algConfig.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipher(algorithm, key.key);
      cipher.setAAD ? cipher.setAAD(Buffer.from(options.aad || '')) : null;
      
      // Encrypt data
      const inputBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
      let encrypted = cipher.update(inputBuffer);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      // Get authentication tag for authenticated encryption
      const tag = cipher.getAuthTag ? cipher.getAuthTag() : Buffer.alloc(0);
      
      // Create result object
      const result = {
        algorithm,
        keyId: key.id,
        keyVersion: key.version,
        iv: iv.toString('base64'),
        data: encrypted.toString('base64'),
        tag: tag.toString('base64'),
        timestamp: new Date().toISOString()
      };
      
      // Update metrics
      this.encryptionMetrics.operationsCount++;
      this.encryptionMetrics.bytesEncrypted += inputBuffer.length;
      
      const duration = Date.now() - startTime;
      
      this.emit('dataEncrypted', {
        keyId: key.id,
        dataSize: inputBuffer.length,
        duration,
        timestamp: new Date().toISOString()
      });
      
      return result;
      
    } catch (error) {
      this.encryptionMetrics.errors++;
      this.emit('encryptionError', {
        error: error.message,
        keyId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Decrypt data
   */
  async decrypt(encryptedData, options = {}) {
    try {
      const startTime = Date.now();
      
      // Parse encrypted data
      const { algorithm, keyId, keyVersion, iv, data, tag } = encryptedData;
      
      // Get decryption key
      let key = this.keys.get(keyId);
      
      // Check key history if not found in active keys
      if (!key && this.keyHistory.has(keyId)) {
        const keyVersions = this.keyHistory.get(keyId);
        key = keyVersions.find(k => k.version === keyVersion);
      }
      
      if (!key) {
        throw new Error('Decryption key not found');
      }
      
      const algConfig = this.algorithms[algorithm];
      if (!algConfig) {
        throw new Error(`Unsupported algorithm: ${algorithm}`);
      }
      
      // Create decipher
      const decipher = crypto.createDecipher(algorithm, key.key);
      
      // Set IV and authentication tag
      const ivBuffer = Buffer.from(iv, 'base64');
      const tagBuffer = Buffer.from(tag, 'base64');
      const dataBuffer = Buffer.from(data, 'base64');
      
      if (decipher.setAuthTag && tagBuffer.length > 0) {
        decipher.setAuthTag(tagBuffer);
      }
      
      if (decipher.setAAD && options.aad) {
        decipher.setAAD(Buffer.from(options.aad));
      }
      
      // Decrypt data
      let decrypted = decipher.update(dataBuffer);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      // Update metrics
      this.encryptionMetrics.operationsCount++;
      this.encryptionMetrics.bytesDecrypted += decrypted.length;
      
      const duration = Date.now() - startTime;
      
      this.emit('dataDecrypted', {
        keyId: key.id,
        dataSize: decrypted.length,
        duration,
        timestamp: new Date().toISOString()
      });
      
      return decrypted;
      
    } catch (error) {
      this.encryptionMetrics.errors++;
      this.emit('decryptionError', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Hash data with salt
   */
  async hash(data, options = {}) {
    const algorithm = options.algorithm || 'sha256';
    const salt = options.salt || crypto.randomBytes(this.config.saltLength);
    const iterations = options.iterations || this.config.iterations;
    
    let hash;
    
    if (this.config.keyDerivation === 'pbkdf2') {
      hash = crypto.pbkdf2Sync(data, salt, iterations, 32, algorithm);
    } else if (this.config.keyDerivation === 'scrypt') {
      hash = crypto.scryptSync(data, salt, 32);
    } else {
      hash = crypto.createHash(algorithm).update(data).digest();
    }
    
    return {
      algorithm,
      hash: hash.toString('base64'),
      salt: salt.toString('base64'),
      iterations: this.config.keyDerivation === 'pbkdf2' ? iterations : undefined
    };
  }

  /**
   * Verify hash
   */
  async verifyHash(data, hashData) {
    const { algorithm, hash, salt, iterations } = hashData;
    const saltBuffer = Buffer.from(salt, 'base64');
    
    let computedHash;
    
    if (this.config.keyDerivation === 'pbkdf2') {
      computedHash = crypto.pbkdf2Sync(data, saltBuffer, iterations, 32, algorithm);
    } else if (this.config.keyDerivation === 'scrypt') {
      computedHash = crypto.scryptSync(data, saltBuffer, 32);
    } else {
      computedHash = crypto.createHash(algorithm).update(data).digest();
    }
    
    const expectedHash = Buffer.from(hash, 'base64');
    return crypto.timingSafeEqual(computedHash, expectedHash);
  }

  /**
   * Generate digital signature
   */
  async sign(data, privateKey, algorithm = 'RSA-SHA256') {
    const sign = crypto.createSign(algorithm);
    sign.update(data);
    return sign.sign(privateKey, 'base64');
  }

  /**
   * Verify digital signature
   */
  async verify(data, signature, publicKey, algorithm = 'RSA-SHA256') {
    const verify = crypto.createVerify(algorithm);
    verify.update(data);
    return verify.verify(publicKey, signature, 'base64');
  }

  /**
   * Generate key pair for asymmetric encryption
   */
  async generateKeyPair(options = {}) {
    const keyOptions = {
      modulusLength: options.modulusLength || 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: options.cipher || 'aes-256-cbc',
        passphrase: options.passphrase
      }
    };
    
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', keyOptions);
    
    const keyPair = {
      id: crypto.randomUUID(),
      publicKey,
      privateKey,
      createdAt: new Date(),
      algorithm: 'RSA',
      keySize: options.modulusLength || 2048
    };
    
    this.emit('keyPairGenerated', {
      keyId: keyPair.id,
      algorithm: keyPair.algorithm,
      keySize: keyPair.keySize,
      timestamp: new Date().toISOString()
    });
    
    return keyPair;
  }

  /**
   * Rotate encryption key
   */
  async rotateKey(keyId) {
    const oldKey = this.keys.get(keyId);
    if (!oldKey) {
      throw new Error('Key not found for rotation');
    }
    
    // Create new key version
    const newKey = {
      ...oldKey,
      key: crypto.randomBytes(this.algorithms[oldKey.algorithm].keyLength),
      version: oldKey.version + 1,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.keyRotationInterval)
    };
    
    // Archive old key
    const keyHistory = this.keyHistory.get(keyId) || [];
    keyHistory.push({ ...oldKey, status: 'archived' });
    this.keyHistory.set(keyId, keyHistory);
    
    // Update active key
    this.keys.set(keyId, newKey);
    await this.saveKey(newKey);
    
    this.encryptionMetrics.keyRotations++;
    
    this.emit('keyRotated', {
      keyId,
      oldVersion: oldKey.version,
      newVersion: newKey.version,
      timestamp: new Date().toISOString()
    });
    
    return newKey;
  }

  /**
   * Setup automatic key rotation
   */
  setupKeyRotation() {
    setInterval(async () => {
      const now = new Date();
      
      for (const [keyId, key] of this.keys) {
        if (key.purpose !== 'master' && key.expiresAt < now) {
          try {
            await this.rotateKey(keyId);
          } catch (error) {
            this.emit('keyRotationError', {
              keyId,
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Save key to secure storage
   */
  async saveKey(key) {
    const keyPath = path.join(this.config.keyStorePath, `${key.id}.key`);
    const keyData = JSON.stringify({
      ...key,
      key: key.key.toString('base64') // Convert buffer to base64 for storage
    }, null, 2);
    
    await fs.writeFile(keyPath, keyData, { mode: 0o600 });
  }

  /**
   * Delete key
   */
  async deleteKey(keyId) {
    if (keyId === this.config.masterKeyId) {
      throw new Error('Cannot delete master key');
    }
    
    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error('Key not found');
    }
    
    // Move to history
    const keyHistory = this.keyHistory.get(keyId) || [];
    keyHistory.push({ ...key, status: 'deleted', deletedAt: new Date() });
    this.keyHistory.set(keyId, keyHistory);
    
    // Remove from active keys
    this.keys.delete(keyId);
    
    // Remove key file
    const keyPath = path.join(this.config.keyStorePath, `${keyId}.key`);
    try {
      await fs.unlink(keyPath);
    } catch (error) {
      console.warn(`Failed to delete key file: ${error.message}`);
    }
    
    this.emit('keyDeleted', {
      keyId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Initialize HSM (Hardware Security Module) support
   */
  async initializeHSM() {
    // This would integrate with actual HSM providers like AWS CloudHSM, Azure Dedicated HSM, etc.
    // For now, this is a placeholder
    console.log('HSM initialization would be implemented here');
  }

  /**
   * Get encryption metrics
   */
  getMetrics() {
    return {
      ...this.encryptionMetrics,
      activeKeys: this.keys.size,
      archivedKeys: Array.from(this.keyHistory.values()).reduce((sum, history) => sum + history.length, 0),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    const masterKey = this.keys.get(this.config.masterKeyId);
    
    return {
      status: masterKey ? 'healthy' : 'unhealthy',
      masterKeyExists: !!masterKey,
      activeKeys: this.keys.size,
      algorithm: this.config.algorithm,
      keyRotationEnabled: this.config.enableKeyRotation,
      hsmEnabled: this.config.enableHSM,
      metrics: this.encryptionMetrics,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Shutdown encryption manager
   */
  async shutdown() {
    // Clear sensitive data from memory
    this.keys.clear();
    this.keyHistory.clear();
    
    this.emit('shutdown', { timestamp: new Date().toISOString() });
  }
}

module.exports = { EncryptionManager };
