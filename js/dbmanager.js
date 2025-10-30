/**
 * Medicare HospitalDB Manager
 * Universal database for Patient, Doctor, and Admin portals
 * Handles database creation, data loading from JSON, CRUD operations, and authentication
 */

class HospitalDB {
    constructor() {
        this.dbName = 'HospitalDB';
        this.version = 1;
        this.db = null;
        this.encryptionKey = 'Medicare2025SecureKey!@#';
    }

    /**
     * Initialize and open the database
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
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
                const db = event.target.result;
                console.log('Upgrading HospitalDB...');

                //patients
                if (!db.objectStoreNames.contains('patients')) {
                    const patientStore = db.createObjectStore('patients', { keyPath: 'id', autoIncrement: true });
                    patientStore.createIndex('NHS', 'NHS', { unique: true });
                    patientStore.createIndex('Email', 'Email', { unique: true });
                    patientStore.createIndex('First', 'First', { unique: false });
                    patientStore.createIndex('Last', 'Last', { unique: false });
                    patientStore.createIndex('Password', 'Password', { unique: false });
                }

                //docs
                if (!db.objectStoreNames.contains('doctors')) {
                    const doctorStore = db.createObjectStore('doctors', { keyPath: 'id', autoIncrement: true });
                    doctorStore.createIndex('Email', 'email', { unique: true });
                    doctorStore.createIndex('first_name', 'first_name', { unique: false });
                    doctorStore.createIndex('last_name', 'last_name', { unique: false });
                    doctorStore.createIndex('Password', 'Password', { unique: false });
                }

                //admin
                if (!db.objectStoreNames.contains('admin')) {
                    const adminStore = db.createObjectStore('admin', { keyPath: 'id', autoIncrement: true });
                    adminStore.createIndex('Email', 'email', { unique: true });
                    adminStore.createIndex('first_name', 'first_name', { unique: false });
                    adminStore.createIndex('last_name', 'last_name', { unique: false });
                    adminStore.createIndex('Password', 'Password', { unique: false });
                }

                //medicine
                if (!db.objectStoreNames.contains('medicines')) {
                    const medicineStore = db.createObjectStore('medicines', { keyPath: 'id', autoIncrement: true });
                    medicineStore.createIndex('Drug', 'Drug', { unique: false });
                }

                //appts
                if (!db.objectStoreNames.contains('appointments')) {
                    const appointmentStore = db.createObjectStore('appointments', { keyPath: 'id', autoIncrement: true });
                    appointmentStore.createIndex('Patient_ID', 'Patient_ID', { unique: false });
                    appointmentStore.createIndex('Doctor_ID', 'Doctor_ID', { unique: false });
                    appointmentStore.createIndex('Date', 'Date', { unique: false });
                    appointmentStore.createIndex('Status', 'Status', { unique: false });
                }

                //prescrpitions
                if (!db.objectStoreNames.contains('treatments')) {
                    const treatmentStore = db.createObjectStore('treatments', { keyPath: 'id', autoIncrement: true });
                    treatmentStore.createIndex('Patient_ID', 'Patient_ID', { unique: false });
                    treatmentStore.createIndex('Doctor_ID', 'Doctor_ID', { unique: false });
                    treatmentStore.createIndex('Medicine_ID', 'Medicine_ID', { unique: false });
                    treatmentStore.createIndex('Status', 'Status', { unique: false });
                }

                // notes
                if (!db.objectStoreNames.contains('medical_notes')) {
                    const notesStore = db.createObjectStore('medical_notes', { keyPath: 'id', autoIncrement: true });
                    notesStore.createIndex('Patient_ID', 'Patient_ID', { unique: false });
                    notesStore.createIndex('Doctor_ID', 'Doctor_ID', { unique: false });
                    notesStore.createIndex('Date', 'Date', { unique: false });
                }
            };
        });
    }

    /**
     * encrypt
     */
    encryptData(data) {
        if (typeof CryptoJS !== 'undefined') {
            return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
        }
        console.warn('CryptoJS not loaded, storing plain text');
        return data;
    }

    /**
     * Decrypt 
     */
    decryptData(encryptedData) {
        if (typeof CryptoJS !== 'undefined') {
            try {
                const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
                return bytes.toString(CryptoJS.enc.Utf8);
            } catch (error) {
                console.error('Decryption error:', error);
                return null;
            }
        }
        return encryptedData;
    }

    /**
     *week4 lab
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
     *json storing stuff
     */
    async loadInitialData() {
        try {
            console.log('Loading initial data from JSON files...');
            
            const patientsResponse = await fetch('https://jsethi-mdx.github.io/cst2572.github.io/patients.json');
            const patientsData = await patientsResponse.json();
            
            const doctorsResponse = await fetch('https://jsethi-mdx.github.io/cst2572.github.io/doctors.json');
            const doctorsData = await doctorsResponse.json();
            
            const adminResponse = await fetch('https://jsethi-mdx.github.io/cst2572.github.io/admin.json');
            const adminData = await adminResponse.json();
            
            const medicinesResponse = await fetch('https://jsethi-mdx.github.io/cst2572.github.io/medicines.json');
            const medicinesData = await medicinesResponse.json();

            //pass -> (patient) 4 storing
            console.log('=== PATIENT CREDENTIALS ===');
            for (const patient of patientsData) {
                const password = this.generateSecurePassword();
                const encryptedPassword = this.encryptData(password);
                
                const patientWithPassword = {
                    ...patient,
                    Password: encryptedPassword,
                    PlainPassword: password //temp (use this 2 see)
                };
                
                await this.addData('patients', patientWithPassword);
                console.log(`Patient: ${patient.First} ${patient.Last} | Email: ${patient.Email} | Password: ${password}`);
            }

            //pass -> (docs (basma)) 4 storing
            console.log('\n=== DOCTOR CREDENTIALS ===');
            for (const doctor of doctorsData) {
                const password = this.generateSecurePassword();
                const encryptedPassword = this.encryptData(password);
                
                const doctorWithPassword = {
                    ...doctor,
                    Password: encryptedPassword,
                    PlainPassword: password
                };
                
                await this.addData('doctors', doctorWithPassword);
                console.log(`Doctor: ${doctor.first_name} ${doctor.last_name} | Email: ${doctor.email} | Password: ${password}`);
            }

            //admin store
            console.log('\n=== ADMIN CREDENTIALS ===');
            for (const admin of adminData) {
                const password = this.generateSecurePassword();
                const encryptedPassword = this.encryptData(password);
                
                const adminWithPassword = {
                    ...admin,
                    Password: encryptedPassword,
                    PlainPassword: password
                };
                
                await this.addData('admin', adminWithPassword);
                console.log(`Admin: ${admin.first_name} ${admin.last_name} | Email: ${admin.email} | Password: ${password}`);
            }

            //store medss
            for (const medicine of medicinesData) {
                await this.addData('medicines', medicine);
            }

            console.log('\nInitial data loaded successfully!');
            console.log('IMPORTANT: Save the credentials above before refreshing!');
            return true;
        } catch (error) {
            console.error('Error loading initial data:', error);
            return false;
        }
    }

    /**
     *addData
     */
    async addData(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     *fetch from store
     */
    async getAllData(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     *data by ID
     */
    async getDataById(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     *data by Index
     */
    async getDataByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.get(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     *data by index val. (1 to many)
     */
    async getAllDataByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     *updateData
     */
    async updateData(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     *deleteData
     */
    async deleteData(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     *authy
     */
    async authenticate(email, password, userType) {
        try {
            const storeName = userType.toLowerCase() + 's'; // 'patients', 'doctors'
            if (userType === 'Admin') {
                storeName = 'admin';
            }
            
            const user = await this.getDataByIndex(storeName, 'Email', email);
            
            if (!user) {
                return { success: false, message: `${userType} not found` };
            }

            //decrypt pass
            const decryptedPassword = this.decryptData(user.Password);
            
            //pass matching/chckings
            const passwordMatch = (decryptedPassword === password) || (user.PlainPassword === password);
            
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
     *authy (convenicnece method)
     */
    async authenticatePatient(email, password) {
        return this.authenticate(email, password, 'Patient');
    }


    async authenticateDoctor(email, password) {
        return this.authenticate(email, password, 'Doctor');
    }

    /**
     */
    async authenticateAdmin(email, password) {
        return this.authenticate(email, password, 'Admin');
    }

    /**
     *get patient appts
     */
    async getPatientAppointments(patientId) {
        return this.getAllDataByIndex('appointments', 'Patient_ID', patientId);
    }

    /**
     *same as above
     */
    async getPatientTreatments(patientId) {
        return this.getAllDataByIndex('treatments', 'Patient_ID', patientId);
    }


    async getPatientMedicalNotes(patientId) {
        return this.getAllDataByIndex('medical_notes', 'Patient_ID', patientId);
    }

    async getDoctorAppointments(doctorId) {
        return this.getAllDataByIndex('appointments', 'Doctor_ID', doctorId);
    }

    /**
     *db check has data
     */
    async isDatabasePopulated() {
        try {
            const patients = await this.getAllData('patients');
            return patients.length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     *sample creds
     */
    async getSampleCredentials(userType = 'Patient') {
        try {
            let storeName;
            if (userType === 'Patient') storeName = 'patients';
            else if (userType === 'Doctor') storeName = 'doctors';
            else if (userType === 'Admin') storeName = 'admin';
            
            const users = await this.getAllData(storeName);
            
            return users.slice(0, 3).map(user => ({
                name: userType === 'Patient' 
                    ? `${user.First} ${user.Last}`
                    : `${user.first_name} ${user.last_name}`,
                email: userType === 'Patient' ? user.Email : user.email,
                password: user.PlainPassword || 'Password encrypted - check console logs'
            }));
        } catch (error) {
            console.error('Error getting sample credentials:', error);
            return [];
        }
    }

    /**
     *data dels clear all data (testing)
     */
    async clearAllData() {
        const stores = ['patients', 'doctors', 'admin', 'medicines', 'appointments', 'treatments', 'medical_notes'];
        
        for (const storeName of stores) {
            try {
                const transaction = this.db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                await store.clear();
            } catch (error) {
                console.error(`Error clearing ${storeName}:`, error);
            }
        }
        console.log('All data cleared from HospitalDB');
    }

    /**
     *-> saves data in session
     */
    saveSession(userId, userType, userName, additionalData = {}) {
        sessionStorage.setItem('userId', userId);
        sessionStorage.setItem('userType', userType);
        sessionStorage.setItem('userName', userName);
        
        //for patients, also store patient ID and NHS
        if (userType === 'Patient' && additionalData.patientId) {
            sessionStorage.setItem('patientId', additionalData.patientId);
        }
        if (additionalData.nhs) {
            sessionStorage.setItem('patientNHS', additionalData.nhs);
        }
    }

    getSession() {
        return {
            userId: sessionStorage.getItem('userId'),
            userType: sessionStorage.getItem('userType'),
            userName: sessionStorage.getItem('userName'),
            patientId: sessionStorage.getItem('patientId'),
            patientNHS: sessionStorage.getItem('patientNHS')
        };
    }

    clearSession() {
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('userType');
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('patientId');
        sessionStorage.removeItem('patientNHS');
    }

    isAuthenticated() {
        return sessionStorage.getItem('userId') !== null;
    }

    requireAuth(redirectUrl = 'login.html') {
        if (!this.isAuthenticated()) {
            window.location.replace(redirectUrl);
            return false;
        }
        return true;
    }
}

const hospitalDB = new HospitalDB();

//int db
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await hospitalDB.init();
        
        //checks exists
        const isPopulated = await hospitalDB.isDatabasePopulated();
        
        if (!isPopulated) {
            console.log('📥 Loading initial data from JSON files...');
            await hospitalDB.loadInitialData();
        } else {
            console.log('HospitalDB already populated');
        }
    } catch (error) {
        console.error('Failed to initialize HospitalDB:', error);
    }
});
