var dbName = 'HospitalDB';
var db;

const request = indexedDB.open(dbName, 2);

// Creating object store in database if it doesnt exist; only executed once
request.onupgradeneeded = function(event){
    db = event.target.result;
    console.log("On upgrade called");

    // If object store doesnt exist it is created
    if (!db.objectStoreNames.contains("User")){
        const UsersStore = db.createObjectStore("User", { keyPath: "id", autoIncrement: true });
        UsersStore.createIndex("First_Name","userfname",{unique:false});
        UsersStore.createIndex("Last_Name","userlname",{unique:false});
        UsersStore.createIndex("Role","userrole",{unique:false});
        UsersStore.createIndex("Email","useremail",{unique:true});
        UsersStore.createIndex("Password","userpassword",{unique:true});
        UsersStore.createIndex("Password_Encrypted","userpasswordencrypt",{unique:true});
    }

    if (!db.objectStoreNames.contains("Medical-Notes")){
        const medicalNotesStore = db.createObjectStore("Medical-Notes", { keyPath: "id", autoIncrement: true });
        medicalNotesStore.createIndex("Patient_NHS","patientNhs",{unique:false});
        medicalNotesStore.createIndex("Doctor_ID","doctorId",{unique:false});
        medicalNotesStore.createIndex("Appointment_ID","appointmentId",{unique:true});
        medicalNotesStore.createIndex("Doctor_Name","doctorName",{unique:false});
        medicalNotesStore.createIndex("Doctor_Speciality","doctorSpeciality",{unique:false});
        medicalNotesStore.createIndex("Date","notesDate",{unique:false});
        medicalNotesStore.createIndex("Reason","notesReason",{unique:false});
        medicalNotesStore.createIndex("Assessment","notesAssessment",{unique:false});
        medicalNotesStore.createIndex("Treatment","notesTreatment",{unique:false});
        medicalNotesStore.createIndex("Medication","notesMedication",{unique:false});
        medicalNotesStore.createIndex("Dosage","notesDosage",{unique:false});
        medicalNotesStore.createIndex("Treatment_Notes","notesAdd",{unique:false});
    }

    if (!db.objectStoreNames.contains("Medicine")){
        const medicineStore = db.createObjectStore("Medicine", { keyPath: "id", autoIncrement: true });
        medicineStore.createIndex("Drug_Name","drugName",{unique:false});
    }

    if (!db.objectStoreNames.contains("Doctor")){
        const doctorStore = db.createObjectStore("Doctor", { keyPath: "id", autoIncrement: true });
        doctorStore.createIndex("First_Name","doctorfname",{unique:false});
        doctorStore.createIndex("Last_Name","doctorlname",{unique:false});
        doctorStore.createIndex("Email","doctormail",{unique:true});
        doctorStore.createIndex("Gender","doctorgender",{unique:false});
        doctorStore.createIndex("Address","doctoraddress",{unique:false});
        doctorStore.createIndex("Telephone","doctorphone",{unique:true});
    } 
    
    if (!db.objectStoreNames.contains("Patient")){
        const PatientStore = db.createObjectStore("Patient", { keyPath: "id", autoIncrement: true });
        PatientStore.createIndex("NHS_Number","patientnhs",{unique:false});
        PatientStore.createIndex("Title","patienttitle",{unique:false});
        PatientStore.createIndex("First_Name","patientfname",{unique:false});
        PatientStore.createIndex("Last_Name","patientlname",{unique:false});
        PatientStore.createIndex("DOB","patientdob",{unique:false});
        PatientStore.createIndex("Email","patientmail",{unique:true});
        PatientStore.createIndex("Gender","patientgender",{unique:false});
        PatientStore.createIndex("Address","patientaddress",{unique:false});
        PatientStore.createIndex("Telephone","patientphone",{unique:true});
    } 
}

request.onsuccess = function(event){
    console.log("Database Successfully Opened");
    db = event.target.result;	
    // Calling functions to retrieve data from JSON file
    loadDoctorData();
    loadPatientData();
    loadMedicationData();
    loadUserData();
    
    // for notifying other scripts that DB is ready
    if (typeof window.onDBReady === 'function') {
        window.onDBReady();
    }
} 

request.onerror = function(event){
    console.log("Error opening Database", event);
} 

// Fetching medicine names from the JSON file
function getMedicationData() {
    const transaction = db.transaction("Medicine", "readonly");
    const store = transaction.objectStore("Medicine");
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = function (event) {
        const meds = event.target.result;
        const medName = meds.map(item => item.Drug || item.drugName);
        const medColumn = document.getElementById("medication-column");
        if (medColumn) {
            medColumn.innerHTML = displayMedication(medName);
        } else {
            console.log("Element not found on this page.");
        }
    };

    getAllRequest.onerror = function (event) {
        console.error("Error reading data from Medicine object store", event);
    };
}

// Generate checkbox for HTML to display the medication names
function displayMedication(medName) {
    let output = '';
    const columns = 4;
    const rowsPerCol = Math.ceil(medName.length / columns);

    for (let column = 0; column < columns; column++) {
        output += `<div class="med-column">\n`;
        for (let row = 0; row < rowsPerCol; row++) {
            const index = column * rowsPerCol + row;
            if (index >= medName.length) break;
            output += `
                <label class="checkbox-label">
                    <input type="checkbox" class="med-checkbox" value="${medName[index]}" id="med${index + 1}">
                    ${medName[index]}
                </label>\n`;
        }
        output += `</div>\n`;
    }
    return output;
}

// Fetching medicine names from the JSON file
function loadMedicationData() {
    const transaction = db.transaction("Medicine", "readonly");
    const store = transaction.objectStore("Medicine");
    const countRequest = store.count();

    countRequest.onsuccess = function() {
        if (countRequest.result == 0){
            console.log("Loading medication records from JSON...");
            fetch('https://jsethi-mdx.github.io/cst2572.github.io/medicines.json')
            .then(response => response.json())
            .then(data => {
                const transaction = db.transaction("Medicine", "readwrite");
                const store = transaction.objectStore("Medicine");

                data.forEach(item => {
                    store.add({
                        drugName: item.Drug 
                    });
                });

                transaction.oncomplete = function() {
                    console.log("All medication data is inserted into database.");
                    getMedicationData();
                };

                transaction.onerror = function(event) {
                    console.error("Transaction error:", event.target.error);
                };
            })
            .catch(error => {
                console.log("Error fetching medicines:", error);
            });
        } else {
            console.log("Medication data already exists in Object Store");
            getMedicationData();
        }
    };
}

function loadDoctorData() {
    const transaction = db.transaction("Doctor", "readonly");
    const store = transaction.objectStore("Doctor");
    const countRequest = store.count();

    countRequest.onsuccess = function() {
        if (countRequest.result == 0){
            console.log("Loading doctor records from JSON...");
            fetch('https://jsethi-mdx.github.io/cst2572.github.io/doctors.json')
            .then(response => response.json())
            .then(data => {
                const transaction = db.transaction("Doctor", "readwrite");
                const store = transaction.objectStore("Doctor");

                data.forEach(item => {
                    store.add({
                        doctorfname: item.first_name,
                        doctorlname: item.last_name,
                        doctormail: item.email,
                        doctorgender: item.gender,
                        doctoraddress: item.Address,
                        doctorphone: item.Telephone 
                    });
                });

                transaction.oncomplete = function() {
                    console.log("All doctor data is inserted into Object Store.");
                };

                transaction.onerror = function(event) {
                    console.error("Transaction error:", event.target.error);
                };
            })
            .catch(error => {
                console.log("Error fetching doctors:", error);
            });
        } else {
            console.log("Doctor data already exists in Object Store");
        }
    };
}

function loadPatientData() {
    const transaction = db.transaction("Patient", "readonly");
    const store = transaction.objectStore("Patient");
    const countRequest = store.count();

    countRequest.onsuccess = function() {
        if (countRequest.result == 0){
            console.log("Loading patient records from JSON...");
            fetch('https://jsethi-mdx.github.io/cst2572.github.io/patients.json')
            .then(response => response.json())
            .then(data => {
                const transaction = db.transaction("Patient", "readwrite");
                const store = transaction.objectStore("Patient");

                data.forEach(item => {
                    store.add({
                        patientnhs: item.NHS,
                        patienttitle: item.Title,
                        patientfname: item.First,
                        patientlname: item.Last,
                        patientdob: item.DOB,
                        patientmail: item.Email,
                        patientgender: item.Gender,
                        patientaddress: item.Address,
                        patientphone: item.Telephone 
                    });
                });

                transaction.oncomplete = function() {
                    console.log("All patient data is inserted into Object Store.");
                };

                transaction.onerror = function(event) {
                    console.error("Transaction error:", event.target.error);
                };
            })
            .catch(error => {
                console.log("Error fetching patients:", error);
            });
        } else {
            console.log("Patient data already exists in Object Store");
        }
    };
}

function loadUserData() {
    const transaction = db.transaction("User", "readonly");
    const store = transaction.objectStore("User");
    const countRequest = store.count();

    countRequest.onsuccess = function() {
        if (countRequest.result == 0){
            console.log("Loading user records from JSON...");
            fetch('https://raw.githubusercontent.com/ivyzzz04/CST2572/refs/heads/main/doctorpassword.json')
            .then(response => response.json())
            .then(data => {
                const transaction = db.transaction("User", "readwrite");
                const store = transaction.objectStore("User");

                data.forEach(item => {
                    store.add({
                        userfname: item.first_name,
                        userlname: item.last_name,
                        userrole: item.role,
                        useremail: item.email,
                        userpassword: item.password,
                        userpasswordencrypt:item.encypted_password
                    });
                });

                transaction.oncomplete = function() {
                    console.log("All user data is inserted into Object Store.");
                };

                transaction.onerror = function(event) {
                    console.error("Transaction error:", event.target.error);
                };
            })
            .catch(error => {
                console.log("Error fetching users:", error);
            });
        } else {
            console.log("User data already exists in Object Store");
        }
    };
}

// Inserting data from form into medical notes object store
function inputMedicalRecord(){
    // Read from the dropdown inputs
    const nhs = document.getElementById("name-input-p") ? document.getElementById("name-input-p").value : "";
    const docname = document.getElementById("name-input-d") ? document.getElementById("name-input-d").value : "";
    const speciality = document.getElementById("speciality").value;
    const date = document.getElementById("date").value;
    const reason = document.getElementById("reason").value;
    const assessment = document.getElementById("assessment").value;
    const treatment = document.getElementById("treatment").value;
    const dosage = document.getElementById("dosage").value;
    const notes = document.getElementById("notes").value;

    const meds = Array.from(document.querySelectorAll('.med-checkbox:checked')).map(checkbox => checkbox.value);
    
    const record = {
        patientNhs: nhs,
        doctorName: docname, 
        doctorSpeciality: speciality,
        appointmentId: Date.now(),
        notesDate: date,
        notesReason: reason,
        notesAssessment: assessment,
        notesTreatment: treatment,
        notesMedication: meds.join(", "),
        notesDosage: dosage,
        notesAdd: notes
    };
    
    const transaction = db.transaction("Medical-Notes", "readwrite");
    const store = transaction.objectStore("Medical-Notes");
    const addRequest = store.add(record);

    addRequest.onsuccess = () => {
        alert("Medical Record Saved!");
        document.querySelector('.doctor-form').reset();
    };

    addRequest.onerror = (event) => {
        alert("Error Saving Record: " + event.target.error.message);
    };
}