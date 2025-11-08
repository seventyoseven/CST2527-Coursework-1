# Medicare

This medical application allows:
- Patients to register register and book appointments with specific doctors.
- Doctors to record and manage patient notes, treatments, and prescribe medications.
- Administrators for CRUD (GDPR compliance) to add, update, or delete patients.

Built using HTML, CSS, and JavaScript, the app interacts with a securely configured database to manage and store medical data.



## Instructions

1. Download the CST2527-Coursework-1-main.zip file and extract its contents.

2. Navigate to the "main" folder and open index.html. Your starting point should look like this URL:
```file:///C:/Users/[your user]/[your directory]/CST2527-Coursework-1-main/main/index.html```

3. Hover over the "login" dropdown option in the top right. You will see two options: "Patient Login" and "Doctor Login". Then, click either.

4. To get the login information (full name, email address, plain text password decrypted), go into Inspect Element (F12) and navigate to the console bar. Depending on the type of role you're attempting to log into, the command will change:
- ```hospitalDB.checkPasswords('patients')```
- ```hospitalDB.checkPasswords('doctors')``` 

- Existing Doctor email: `vrilton0@discuz.net`
- Existing Patient email: `lvasilik0@java.com`

5. To get to the Admin's login page, navigate to index.html and scroll to the bottom. You will find: "Admin Portal" and the link should look like this:
```file:///C:/Users/[your user]/[your directory]/CST2527-Coursework-1-main/admin/login.html```

6. Run this command to receive the login information for the admin:
- ```hospitalDB.checkPasswords('admin')```

- Existing Admin email: `skestian0@telegraph.co.uk`



## References

[Bogdantd. (2025, October 1). Sucuri Security – Auditing, malware scanner and security hardening. WordPress.org.](https://wordpress.org/plugins/sucuri-scanner/)

[SentinelOne. (2025, October 7). What is Malware Detection? Importance & Techniques. SentinelOne.](https://www.sentinelone.com/cybersecurity-101/threat-intelligence/what-is-malware-detection/)

[Containment - AWS Security Incident Response User Guide. (n.d.).](https://docs.aws.amazon.com/security-ir/latest/userguide/containment.html)

[Flinders, M., & Smalley, I. (2025, October 9). Cyber Recovery. IBM.](https://www.ibm.com/think/topics/cyber-recovery#:~:text=Cyber%20recovery%20is%20a%20type,or%20destroy%20their%20sensitive%20data.)

[W3Schools.com. (n.d.). Fontawesome Icons Webapp](https://www.w3schools.com/icons/fontawesome_icons_webapp.asp)

[GeeksforGeeks. (2025, July 23). JavaScript how to create dropdown list?](ascript/how-to-create-dropdown-list-using-javascript/)
