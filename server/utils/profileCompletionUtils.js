// Profile Completion Calculation Utility
// This utility calculates the profile completion percentage based on filled fields

/**
 * Calculate profile completion percentage for an employee
 * @param {Object} user - User object from User model
 * @param {Object} employee - Employee object from Employee model (can be null)
 * @returns {Object} - { percentage, breakdown, missingFields }
 */
const calculateProfileCompletion = (user, employee) => {
    const weights = {
        basicProfile: 20,      // name, email, phone, domain
        personalInfo: 15,      // DOB, gender, marital status, blood group
        address: 10,           // house, city, state, pincode
        nationalId: 10,        // type, number
        emergencyContact: 10,  // name, phone, relationship
        education: 10,         // qualification, course, university, year, percentage
        professional: 10,      // experience, skills, etc.
        bankDetails: 10,       // bank name, account, IFSC, branch, UPI
        jobDetails: 5          // department, designation, joining date, location, shift, type
    };

    const breakdown = {};
    const missingFields = {};

    // 1. Basic Profile (20%)
    let basicScore = 0;
    const basicFields = ['fullName', 'email', 'phone', 'domain'];
    const basicMissing = [];

    basicFields.forEach(field => {
        if (user && user[field] && user[field].toString().trim()) {
            basicScore += 25; // 100/4 fields
        } else {
            basicMissing.push(field);
        }
    });
    breakdown.basicProfile = (basicScore / 100) * weights.basicProfile;
    if (basicMissing.length > 0) missingFields.basicProfile = basicMissing;

    // If no employee details exist, return basic profile only
    if (!employee) {
        return {
            percentage: breakdown.basicProfile,
            breakdown,
            missingFields,
            totalPossible: 100
        };
    }

    // 2. Personal Information (15%)
    let personalScore = 0;
    const personalMissing = [];
    const personalFields = [
        { key: 'dateOfBirth', weight: 25 },
        { key: 'gender', weight: 25 },
        { key: 'maritalStatus', weight: 25 },
        { key: 'bloodGroup', weight: 25 }
    ];

    personalFields.forEach(({ key, weight }) => {
        if (employee[key] && employee[key].toString().trim()) {
            personalScore += weight;
        } else {
            personalMissing.push(key);
        }
    });
    breakdown.personalInfo = (personalScore / 100) * weights.personalInfo;
    if (personalMissing.length > 0) missingFields.personalInfo = personalMissing;

    // 3. Address (10%)
    let addressScore = 0;
    const addressMissing = [];
    if (employee.address) {
        const addressFields = ['house', 'city', 'state', 'pincode'];
        addressFields.forEach(field => {
            if (employee.address[field] && employee.address[field].toString().trim()) {
                addressScore += 25; // 100/4 fields
            } else {
                addressMissing.push(`address.${field}`);
            }
        });
    } else {
        addressMissing.push('address.house', 'address.city', 'address.state', 'address.pincode');
    }
    breakdown.address = (addressScore / 100) * weights.address;
    if (addressMissing.length > 0) missingFields.address = addressMissing;

    // 4. National ID (10%)
    let nationalIdScore = 0;
    const nationalIdMissing = [];
    if (employee.nationalId) {
        if (employee.nationalId.type && employee.nationalId.type.trim()) {
            nationalIdScore += 50;
        } else {
            nationalIdMissing.push('nationalId.type');
        }
        if (employee.nationalId.number && employee.nationalId.number.trim()) {
            nationalIdScore += 50;
        } else {
            nationalIdMissing.push('nationalId.number');
        }
    } else {
        nationalIdMissing.push('nationalId.type', 'nationalId.number');
    }
    breakdown.nationalId = (nationalIdScore / 100) * weights.nationalId;
    if (nationalIdMissing.length > 0) missingFields.nationalId = nationalIdMissing;

    // 5. Emergency Contact (10%)
    let emergencyScore = 0;
    const emergencyMissing = [];
    if (employee.emergencyContact) {
        const emergencyFields = ['name', 'phone', 'relationship'];
        let filledCount = 0;
        emergencyFields.forEach(field => {
            if (employee.emergencyContact[field] && employee.emergencyContact[field].toString().trim()) {
                filledCount++;
            } else {
                emergencyMissing.push(`emergencyContact.${field}`);
            }
        });
        emergencyScore = (filledCount / emergencyFields.length) * 100;
    } else {
        emergencyMissing.push('emergencyContact.name', 'emergencyContact.phone', 'emergencyContact.relationship');
    }
    breakdown.emergencyContact = (emergencyScore / 100) * weights.emergencyContact;
    if (emergencyMissing.length > 0) missingFields.emergencyContact = emergencyMissing;

    // 6. Education (10%)
    let educationScore = 0;
    const educationMissing = [];
    if (employee.education) {
        const educationFields = ['highestQualification', 'course', 'university', 'yearOfPassing', 'percentage'];
        let filledCount = 0;
        educationFields.forEach(field => {
            if (employee.education[field] && employee.education[field].toString().trim()) {
                filledCount++;
            } else {
                educationMissing.push(`education.${field}`);
            }
        });
        educationScore = (filledCount / educationFields.length) * 100;
    } else {
        educationMissing.push('education.highestQualification', 'education.course', 'education.university', 'education.yearOfPassing', 'education.percentage');
    }
    breakdown.education = (educationScore / 100) * weights.education;
    if (educationMissing.length > 0) missingFields.education = educationMissing;

    // 7. Professional Details (10%)
    let professionalScore = 0;
    const professionalMissing = [];
    if (employee.professional) {
        let totalWeight = 0;
        let earnedWeight = 0;

        // Is Fresher status (always required)
        totalWeight += 20;
        if (employee.professional.isFresher !== undefined) {
            earnedWeight += 20;
        } else {
            professionalMissing.push('professional.isFresher');
        }

        // Experience details
        if (employee.professional.isFresher === false) {
            const expFields = ['previousCompany', 'yearsOfExperience', 'lastJobRole'];
            expFields.forEach(field => {
                totalWeight += 15;
                if (employee.professional[field] && employee.professional[field].toString().trim()) {
                    earnedWeight += 15;
                } else {
                    professionalMissing.push(`professional.${field}`);
                }
            });
        }

        // Skills (always required)
        totalWeight += 20;
        if (employee.professional.skills && (Array.isArray(employee.professional.skills) ? employee.professional.skills.length > 0 : employee.professional.skills.toString().trim())) {
            earnedWeight += 20;
        } else {
            professionalMissing.push('professional.skills');
        }

        // LinkedIn and Portfolio (Social links - truly optional)
        // They only contribute weight IF they are provided. 
        // If not provided, they don't count towards the 100% target for this section.
        const optionalFields = ['linkedIn', 'portfolio'];
        optionalFields.forEach(field => {
            if (employee.professional[field] && employee.professional[field].toString().trim()) {
                totalWeight += 7.5;
                earnedWeight += 7.5;
            }
        });

        professionalScore = (earnedWeight / totalWeight) * 100;
    } else {
        professionalMissing.push('professional.isFresher', 'professional.skills');
    }
    breakdown.professional = (professionalScore / 100) * weights.professional;
    if (professionalMissing.length > 0) missingFields.professional = professionalMissing;

    // 8. Bank Details (10%)
    let bankScore = 0;
    const bankMissing = [];
    if (employee.bankDetails) {
        const bankFields = ['bankName', 'accountNumber', 'ifscCode', 'branch', 'upiId'];
        let filledCount = 0;
        bankFields.forEach(field => {
            if (employee.bankDetails[field] && employee.bankDetails[field].toString().trim()) {
                filledCount++;
            } else {
                bankMissing.push(`bankDetails.${field}`);
            }
        });
        bankScore = (filledCount / bankFields.length) * 100;
    } else {
        bankMissing.push('bankDetails.bankName', 'bankDetails.accountNumber', 'bankDetails.ifscCode', 'bankDetails.branch', 'bankDetails.upiId');
    }
    breakdown.bankDetails = (bankScore / 100) * weights.bankDetails;
    if (bankMissing.length > 0) missingFields.bankDetails = bankMissing;

    // 9. Job Details (5%)
    let jobScore = 0;
    const jobMissing = [];
    if (employee.jobDetails) {
        const jobFields = ['department', 'designation', 'dateOfJoining', 'workLocation', 'shiftTiming', 'employmentType'];
        let filledCount = 0;
        jobFields.forEach(field => {
            if (employee.jobDetails[field] && employee.jobDetails[field].toString().trim()) {
                filledCount++;
            } else {
                jobMissing.push(`jobDetails.${field}`);
            }
        });
        jobScore = (filledCount / jobFields.length) * 100;
    } else {
        jobMissing.push('jobDetails.department', 'jobDetails.designation', 'jobDetails.dateOfJoining', 'jobDetails.workLocation', 'jobDetails.shiftTiming', 'jobDetails.employmentType');
    }
    breakdown.jobDetails = (jobScore / 100) * weights.jobDetails;
    if (jobMissing.length > 0) missingFields.jobDetails = jobMissing;

    // Calculate total percentage
    const totalPercentage = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    return {
        percentage: Math.min(100, Math.round(totalPercentage)), // Round to nearest integer and cap at 100
        breakdown,
        missingFields,
        totalPossible: 100
    };
};

module.exports = {
    calculateProfileCompletion
};
