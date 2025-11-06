/**
 * Medicare HospitalDB Manager
 */

class HospitalDB {
    constructor() {
        this.dbName = 'HospitalDB';
        this.version = 2;
        this.db = null;
        this.encryptionKey = 'Medicare2025SecureKey!@#';
    }

    /**
     * wait 4 db
     */
    async waitForDB(timeoutMs = 5000) {
        const start = Date.now();
        while (!this.db) {
            if (Date.now() - start > timeoutMs) {
                throw new Error('Timed out waiting for DB to be ready');
            }
            await new Promise(r => setTimeout(r, 50));
        }
    }

    /**
     * open db
     */
    async init() {
        return new Promise((resolve, reject) => {
            var request = indexedDB.open(this.dbName, this.version);

            request.onerror = function(event) {
                console.error('Error opening database');
                reject(request.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                window.db = this.db;
                console.log('HospitalDB opened successfully');

                if (window.onDBReady) {
                    window.onDBReady();
                }

                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                var db = event.target.result;
                console.log('Upgrading HospitalDB');

                // Patients
                if (!db.objectStoreNames.contains('patients')) {
                    var patientStore = db.createObjectStore('patients', { keyPath: 'id', autoIncrement: true });
                    patientStore.createIndex('NHS', 'NHS', { unique: true });
                    patientStore.createIndex('Email', 'Email', { unique: true });
                    patientStore.createIndex('First', 'First', { unique: false });
                    patientStore.createIndex('Last', 'Last', { unique: false });
                    patientStore.createIndex('Password', 'Password', { unique: false });
                }

                // Doctors
                if (!db.objectStoreNames.contains('doctors')) {
                    var doctorStore = db.createObjectStore('doctors', { keyPath: 'id', autoIncrement: true });
                    doctorStore.createIndex('Email', 'email', { unique: true });
                    doctorStore.createIndex('first_name', 'first_name', { unique: false });
                    doctorStore.createIndex('last_name', 'last_name', { unique: false });
                    doctorStore.createIndex('gender', 'gender', { unique: false });
                    doctorStore.createIndex('Address', 'Address', { unique: false });
                    doctorStore.createIndex('Telephone', 'Telephone', { unique: false });
                    doctorStore.createIndex('Password', 'Password', { unique: false });
                }

                // Admin
                if (!db.objectStoreNames.contains('admin')) {
                    var adminStore = db.createObjectStore('admin', { keyPath: 'id', autoIncrement: true });
                    adminStore.createIndex('Email', 'email', { unique: true });
                    adminStore.createIndex('first_name', 'first_name', { unique: false });
                    adminStore.createIndex('last_name', 'last_name', { unique: false });
                    adminStore.createIndex('Password', 'Password', { unique: false });
                }

                // Medicines
                if (!db.objectStoreNames.contains('medicines')) {
                    var medicineStore = db.createObjectStore('medicines', { keyPath: 'id', autoIncrement: true });
                    medicineStore.createIndex('Drug', 'Drug', { unique: false });
                }

                // Appointments
                if (!db.objectStoreNames.contains('appointments')) {
                    var appointmentStore = db.createObjectStore('appointments', { keyPath: 'id', autoIncrement: true });
                    appointmentStore.createIndex('Patient_ID', 'Patient_ID', { unique: false });
                    appointmentStore.createIndex('Doctor_ID', 'Doctor_ID', { unique: false });
                    appointmentStore.createIndex('Date', 'Date', { unique: false });
                    appointmentStore.createIndex('Status', 'Status', { unique: false });
                }

                // Treatments
                if (!db.objectStoreNames.contains('treatments')) {
                    var treatmentStore = db.createObjectStore('treatments', { keyPath: 'id', autoIncrement: true });
                    treatmentStore.createIndex('Patient_ID', 'Patient_ID', { unique: false });
                    treatmentStore.createIndex('Doctor_ID', 'Doctor_ID', { unique: false });
                    treatmentStore.createIndex('Medicine_ID', 'Medicine_ID', { unique: false });
                    treatmentStore.createIndex('Status', 'Status', { unique: false });
                }

                // Medical Notes
                if (!db.objectStoreNames.contains('medical_notes')) {
                    var notesStore = db.createObjectStore('medical_notes', { keyPath: 'id', autoIncrement: true });
                    notesStore.createIndex('Patient_ID', 'Patient_ID', { unique: false });
                    notesStore.createIndex('Doctor_ID', 'Doctor_ID', { unique: false });
                    notesStore.createIndex('Date', 'Date', { unique: false });
                    notesStore.createIndex('Notes', 'Notes', { unique: false });
                    notesStore.createIndex('Diagnosis', 'Diagnosis', { unique: false });
                }

                // Refills
                if (!db.objectStoreNames.contains('refills')) {
                    var refillStore = db.createObjectStore('refills', { keyPath: 'id', autoIncrement: true });
                    refillStore.createIndex('Patient_ID', 'Patient_ID', { unique: false });
                    refillStore.createIndex('Treatment_ID', 'Treatment_ID', { unique: false });
                    refillStore.createIndex('Status', 'Status', { unique: false });
                    refillStore.createIndex('Date_Requested', 'Date_Requested', { unique: false });
                }
            };
        });
    }

    /**
     * encrypt (aes 256)
     */
    encryptData(data) {
        if (typeof CryptoJS !== 'undefined') {
            var encrypted = CryptoJS.AES.encrypt(String(data), this.encryptionKey).toString();
            return encrypted;
        }
        console.warn('CryptoJS not loaded, storing plain text');
        return data;
    }

    /**
     * decrypt
     */
    decryptData(encryptedData) {
        if (typeof CryptoJS !== 'undefined' && typeof encryptedData === 'string') {
            try {
                var bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
                var decrypted = bytes.toString(CryptoJS.enc.Utf8);
                return decrypted;
            } catch (error) {
                console.error('Decryption error:', error);
                return null;
            }
        }
        return encryptedData;
    }

    /**
     * Sanitize input by replacing special characters with HTML entities
     */
    sanitizeInput(input) {
        var sanitized = input
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#x27;")
            .replace(/\//g, "&#x2F;");
        return sanitized;
    }

    /**
     * password validation
     */
    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*]/.test(password);
        
        if (password.length < minLength) {
            return { valid: false, message: 'Password must be at least 8 characters' };
        }
        if (!hasUpperCase || !hasLowerCase) {
            return { valid: false, message: 'Password must contain uppercase and lowercase letters' };
        }
        if (!hasNumbers) {
            return { valid: false, message: 'Password must contain at least one number' };
        }
        if (!hasSpecialChar) {
            return { valid: false, message: 'Password must contain a special character (!@#$%^&*)' };
        }
        
        return { valid: true, message: 'Password is strong' };
    }

    /**
     * email validation
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * generate pass
     */
    generateSecurePassword() {
        const length = 12;
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return password;
    }

    /**
     * fetch json
     */
    async loadInitialData() {
        try {
            console.log('Fetching JSON files');

            var patientsResponse = await fetch('https://jsethi-mdx.github.io/cst2572.github.io/patients.json');
            var patientsData = await patientsResponse.json();

            var doctorsResponse = await fetch('https://jsethi-mdx.github.io/cst2572.github.io/doctors.json');
            var doctorsData = await doctorsResponse.json();

            var adminResponse = await fetch('https://jsethi-mdx.github.io/cst2572.github.io/admin.json');
            var adminData = await adminResponse.json();

            var medicinesResponse = await fetch('https://jsethi-mdx.github.io/cst2572.github.io/medicines.json');
            var medicinesData = await medicinesResponse.json();

            // Load patients
            for (const patient of patientsData) {
                var password = this.generateSecurePassword();
                var encryptedPassword = this.encryptData(password);

                var patientWithPassword = {
                    ...patient,
                    Password: encryptedPassword,
                    PlainPassword: password
                };

                await this.addData('patients', patientWithPassword);
            }

            // Load doctors
            for (const doctor of doctorsData) {
                var password = this.generateSecurePassword();
                var encryptedPassword = this.encryptData(password);

                var doctorWithPassword = {
                    first_name: doctor.first_name,
                    last_name: doctor.last_name,
                    gender: doctor.gender,
                    Address: doctor.Address,
                    email: doctor.email,
                    Telephone: doctor.Telephone,
                    Password: encryptedPassword,
                    PlainPassword: password
                };

                await this.addData('doctors', doctorWithPassword);
            }

            // Load admins
            for (const admin of adminData) {
                var password = this.generateSecurePassword();
                var encryptedPassword = this.encryptData(password);

                var adminWithPassword = {
                    ...admin,
                    Password: encryptedPassword,
                    PlainPassword: password
                };

                await this.addData('admin', adminWithPassword);
            }

            // Load medicines
            for (const medicine of medicinesData) {
                await this.addData('medicines', medicine);
            }

            console.log('JSON data loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading initial data:', error);
            return false;
        }
    }

    /**
     * add data
     */
    async addData(storeName, data) {
        await this.waitForDB();
        return new Promise((resolve, reject) => {
            var transaction = this.db.transaction(storeName, 'readwrite');
            var store = transaction.objectStore(storeName);
            var request = store.add(data);

            request.onsuccess = function() {
                resolve(request.result);
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    }

    /**
     * get all data
     */
    async getAllData(storeName) {
        await this.waitForDB();
        return new Promise((resolve, reject) => {
            var transaction = this.db.transaction(storeName, 'readonly');
            var store = transaction.objectStore(storeName);
            var request = store.getAll();

            request.onsuccess = function() {
                resolve(request.result);
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    }

    /**
     * get data (id)
     */
    async getDataById(storeName, id) {
        await this.waitForDB();
        return new Promise((resolve, reject) => {
            var transaction = this.db.transaction(storeName, 'readonly');
            var store = transaction.objectStore(storeName);
            var request = store.get(id);

            request.onsuccess = function() {
                resolve(request.result);
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    }

    /**
     * get data (index)
     */
    async getDataByIndex(storeName, indexName, value) {
        await this.waitForDB();
        return new Promise((resolve, reject) => {
            var transaction = this.db.transaction(storeName, 'readonly');
            var store = transaction.objectStore(storeName);
            var index = store.index(indexName);
            var request = index.get(value);

            request.onsuccess = function() {
                resolve(request.result);
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    }

    /**
     * get all data (indx)
     */
    async getAllDataByIndex(storeName, indexName, value) {
        await this.waitForDB();
        return new Promise((resolve, reject) => {
            var transaction = this.db.transaction(storeName, 'readonly');
            var store = transaction.objectStore(storeName);
            var index = store.index(indexName);
            var request = index.getAll(value);

            request.onsuccess = function() {
                resolve(request.result);
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    }

    /**
     * update data
     */
    async updateData(storeName, data) {
        await this.waitForDB();
        return new Promise((resolve, reject) => {
            var transaction = this.db.transaction(storeName, 'readwrite');
            var store = transaction.objectStore(storeName);
            var request = store.put(data);

            request.onsuccess = function() {
                resolve(request.result);
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    }

    /**
     * del data
     */
    async deleteData(storeName, id) {
        await this.waitForDB();
        return new Promise((resolve, reject) => {
            var transaction = this.db.transaction(storeName, 'readwrite');
            var store = transaction.objectStore(storeName);
            var request = store.delete(id);

            request.onsuccess = function() {
                resolve(request.result);
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    }

    /**
     * authy
     */
    async authenticate(email, password, userType) {
        try {
            var storeName;
            if (userType === 'Patient') storeName = 'patients';
            else if (userType === 'Doctor') storeName = 'doctors';
            else if (userType === 'Admin') storeName = 'admin';
            else storeName = userType.toLowerCase() + 's';

            await this.waitForDB();

            var user = await this.getDataByIndex(storeName, 'Email', email);

            if (!user) {
                return { success: false, message: `${userType} not found` };
            }

            var decryptedPassword = this.decryptData(user.Password);
            var passwordMatch = (decryptedPassword === password) || (user.PlainPassword === password);

            if (passwordMatch) {
                return {
                    success: true,
                    user: user,
                    userType: userType
                };
            } else {
                return { success: false, message: 'Incorrect password' };
            }
        } catch (error) {
            console.error('Authentication error:', error);
            return { success: false, message: 'Authentication failed' };
        }
    }

    /**
     * get nhs
     */
    async getNHSPatientId(nhs) {
        var patient = await this.getDataByIndex('patients', 'NHS', nhs);
        return patient ? patient.id : null;
    }

    /**
     * auth patient
     */
    async authenticatePatient(email, password) {
        return this.authenticate(email, password, 'Patient');
    }

    /**
     * auth doc
     */
    async authenticateDoctor(email, password) {
        return this.authenticate(email, password, 'Doctor');
    }

    /**
     * authy admin
     */
    async authenticateAdmin(email, password) {
        return this.authenticate(email, password, 'Admin');
    }

    /**
     * get patient appointments
     */
    async getPatientAppointments(patientId) {
        return this.getAllDataByIndex('appointments', 'Patient_ID', patientId);
    }

    /**
     * get patient treatments
     */
    async getPatientTreatments(patientId) {
        return this.getAllDataByIndex('treatments', 'Patient_ID', patientId);
    }

    /**
     * get medical notes
     */
    async getPatientMedicalNotes(patientId) {
        return this.getAllDataByIndex('medical_notes', 'Patient_ID', patientId);
    }

    /**
     * get doc appts
     */
    async getDoctorAppointments(doctorId) {
        return this.getAllDataByIndex('appointments', 'Doctor_ID', doctorId);
    }

    /**
     * check if db populated
     */
    async isDatabasePopulated() {
        try {
            var patients = await this.getAllData('patients');
            return patients.length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * sample creds only for testing, commented out as unused.. its the "sample creds" button we had before
     */
    // async getSampleCredentials(userType = 'Patient') {
    //     try {
    //         var storeName;
    //         if (userType === 'Patient') storeName = 'patients';
    //         else if (userType === 'Doctor') storeName = 'doctors';
    //         else if (userType === 'Admin') storeName = 'admin';
    //         else storeName = userType.toLowerCase() + 's';

    //         await this.waitForDB();

    //         var users = await this.getAllData(storeName);

    //         return users.slice(0, 3).map(user => {
    //             if (userType === 'Patient') {
    //                 return {
    //                     name: `${user.First} ${user.Last}`,
    //                     email: user.Email,
    //                     password: user.PlainPassword || 'Password encrypted'
    //                 };
    //             } else {
    //                 return {
    //                     name: `${user.first_name || user.First || ''} ${user.last_name || user.Last || ''}`.trim(),
    //                     email: user.email || user.Email || '',
    //                     password: user.PlainPassword || 'Password encrypted'
    //                 };
    //             }
    //         });
    //     } catch (error) {
    //         console.error('Error getting sample credentials:', error);
    //         return [];
    //     }
    // }

    /**
     * clear all data
     */
    async clearAllData() {
        var stores = ['patients', 'doctors', 'admin', 'medicines', 'appointments', 'treatments', 'medical_notes', 'refills'];

        for (const storeName of stores) {
            try {
                var transaction = this.db.transaction(storeName, 'readwrite');
                var store = transaction.objectStore(storeName);
                await store.clear();
            } catch (error) {
                console.error(`Error clearing ${storeName}:`, error);
            }
        }
        console.log('All data cleared from HospitalDB');
    }

    /**
     * save session
     */
    saveSession(userId, userType, userName, additionalData = {}) {
        sessionStorage.setItem('userId', userId);
        sessionStorage.setItem('userType', userType);
        sessionStorage.setItem('userName', userName);

        if (userType === 'Patient' && additionalData.patientId) {
            sessionStorage.setItem('patientId', additionalData.patientId);
        }
        if (additionalData.nhs) {
            sessionStorage.setItem('patientNHS', additionalData.nhs);
        }
    }

    /**
     * get session
     */
    getSession() {
        return {
            userId: sessionStorage.getItem('userId'),
            userType: sessionStorage.getItem('userType'),
            userName: sessionStorage.getItem('userName'),
            patientId: sessionStorage.getItem('patientId'),
            patientNHS: sessionStorage.getItem('patientNHS')
        };
    }

    /**
     * clear session
     */
    clearSession() {
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('userType');
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('patientId');
        sessionStorage.removeItem('patientNHS');
    }

    /**
     * check authy
     */
    isAuthenticated() {
        return sessionStorage.getItem('userId') !== null;
    }

    /**
     * req authy
     */
    requireAuth(redirectUrl = 'login.html') {
        if (!this.isAuthenticated()) {
            window.location.replace(redirectUrl);
            return false;
        }
        return true;
    }

    /**
     * hospitalDB.checkPasswords('patients')
     * hospitalDB.checkPasswords('patients')
     * hospitalDB.checkPasswords('patients')
     */
    async checkPasswords(userType = 'patients') {
        try {
            var users = await this.getAllData(userType);
            console.log(`\n=== ${userType.toUpperCase()} PASSWORDS ===`);
            
            users.forEach(user => {
                var name = user.First ? `${user.First} ${user.Last}` : `${user.first_name} ${user.last_name}`;
                var email = user.Email || user.email;
                var plainPassword = user.PlainPassword || 'Not available';
                
                console.log(`Name: ${name}`);
                console.log(`Email: ${email}`);
                console.log(`Password: ${plainPassword}`);
                console.log('---');
            });
        } catch (error) {
            console.error('Error checking passwords:', error);
        }
    }
}

var hospitalDB = new HospitalDB();

document.addEventListener('DOMContentLoaded', async function() {
    try {
        await hospitalDB.init();

        var isPopulated = await hospitalDB.isDatabasePopulated();

        if (!isPopulated) {
            console.log('Fetching data from JSON');
            await hospitalDB.loadInitialData();
        } else {
            console.log('HospitalDB already populated');
        }
    } catch (error) {
        console.error('Failed to initialize HospitalDB:', error);
    }
});