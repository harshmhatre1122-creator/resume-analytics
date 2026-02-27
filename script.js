// ============================================
// RESUME ANALYZER PRO - FULL WORKING VERSION
// ============================================


// ==============================
// MAIN ANALYZE FUNCTION
// ==============================

async function analyzeResume() {

    const fileInput = document.getElementById("resumeUpload");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please upload a resume first.");
        return;
    }

    showLoading("Parsing your resume...");

    try {
        const text = await extractPDFText(file);
        generateReport(text);
    } catch (err) {
        console.error(err);
        hideLoading();
        alert("Error reading PDF.");
    }
}


// ==============================
// PDF TEXT EXTRACTION
// ==============================

async function extractPDFText(file) {

    const reader = new FileReader();

    return new Promise((resolve, reject) => {

        reader.onload = async function () {

            try {
                const typedarray = new Uint8Array(this.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;

                let text = "";

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();

                    content.items.forEach(item => {
                        text += item.str + " ";
                    });
                }

                resolve(text);

            } catch (error) {
                reject(error);
            }
        };

        reader.readAsArrayBuffer(file);
    });
}


// ==============================
// GENERATE REPORT
// ==============================

function generateReport(text) {

    hideLoading();
    document.getElementById("report").classList.remove("hidden");

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    const name = detectName(lines);
    const contact = extractContactInfo(text);

    const summary = extractSection(text, ["summary"]);
    const experience = extractSection(text, ["experience", "work experience"]);
    const education = extractSection(text, ["education"]);
    const projects = extractSection(text, ["projects"]);
    const certifications = extractSection(text, ["certifications"]);

    const skills = extractSkills(text);

    const projectCount = projects.length;
    const experienceYears = detectExperienceYears(text);

    const score = calculateScore(projectCount, skills.length, experienceYears);

    updateScoreUI(score, projectCount, skills.length, experienceYears);
    generateIssues(projectCount, skills.length, experienceYears);

    document.getElementById("candidateName").innerText = name;

    document.getElementById("resumePreview").innerHTML =
        generateResumeTemplate(
            name,
            contact,
            summary,
            experience,
            education,
            projects,
            skills,
            certifications
        );
}


// ==============================
// NAME DETECTION
// ==============================

function detectName(lines) {

    for (let line of lines.slice(0, 10)) {
        if (line.length > 4 && /^[A-Za-z\s]+$/.test(line)) {
            return line;
        }
    }

    return "Candidate Name";
}


// ==============================
// CONTACT EXTRACTION
// ==============================

function extractContactInfo(text) {

    const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const phoneMatch = text.match(/\+?\d[\d\s\-]{8,}/);

    return {
        email: emailMatch ? emailMatch[0] : "Not detected",
        phone: phoneMatch ? phoneMatch[0] : "Not detected"
    };
}


// ==============================
// SECTION EXTRACTION
// ==============================

function extractSection(text, keywords) {

    const lower = text.toLowerCase();

    for (let key of keywords) {
        const index = lower.indexOf(key);
        if (index !== -1) {
            return text.substring(index, index + 500);
        }
    }

    return "Not detected.";
}


// ==============================
// SKILL EXTRACTION
// ==============================

function extractSkills(text) {

    const skillKeywords = [
        "javascript","react","node","express","python","java",
        "sql","mysql","mongodb","flask","html","css",
        "power bi","git","linux","docker","api"
    ];

    const lower = text.toLowerCase();
    return skillKeywords.filter(skill => lower.includes(skill))
                        .map(skill => skill.toUpperCase());
}


// ==============================
// EXPERIENCE YEARS
// ==============================

function detectExperienceYears(text) {

    const years = text.match(/20\d{2}/g);
    if (!years || years.length < 2) return 0;

    const nums = years.map(Number);
    return Math.max(...nums) - Math.min(...nums);
}


// ==============================
// SCORE CALCULATION
// ==============================

function calculateScore(projects, skills, experience) {

    let score = 50;

    score += Math.min(projects * 5, 20);
    score += Math.min(skills * 3, 20);
    score += Math.min(experience * 5, 10);

    return Math.min(score, 100);
}


// ==============================
// UPDATE UI
// ==============================

function updateScoreUI(score, projects, skills, experience) {

    document.getElementById("scoreValue").innerText = score;

    setProgress("contentBar", score);
    setProgress("sectionBar", Math.min(projects * 20, 100));
    setProgress("atsBar", Math.min(skills * 10, 100));
    setProgress("tailorBar", Math.min(experience * 20, 100));
}

function setProgress(id, value) {
    document.getElementById(id).style.width = value + "%";
}


// ==============================
// ISSUE GENERATION
// ==============================

function generateIssues(projects, skills, experience) {

    const list = document.getElementById("issuesList");
    list.innerHTML = "";

    if (projects < 3) addIssue("Add more structured projects.");
    if (skills < 5) addIssue("Add more technical skills.");
    if (experience < 2) addIssue("Add quantified experience duration.");

    if (!list.innerHTML) {
        addIssue("No major structural issues detected.");
    }
}

function addIssue(text) {
    const li = document.createElement("li");
    li.innerText = text;
    document.getElementById("issuesList").appendChild(li);
}


// ==============================
// RESUME TEMPLATE
// ==============================

function generateResumeTemplate(
    name,
    contact,
    summary,
    experience,
    education,
    projects,
    skills,
    certifications
) {

    return `
    <div class="resume-modern" id="downloadArea">
        <h1>${name}</h1>
        <p>Email: ${contact.email} | Phone: ${contact.phone}</p>
        <hr/>
        <h3>SUMMARY</h3>
        <p>${summary}</p>
        <h3>EXPERIENCE</h3>
        <p>${experience}</p>
        <h3>EDUCATION</h3>
        <p>${education}</p>
        <h3>PROJECTS</h3>
        <p>${projects}</p>
        <h3>SKILLS</h3>
        <p>${skills.join(", ")}</p>
        <h3>CERTIFICATIONS</h3>
        <p>${certifications}</p>
    </div>
    `;
}


// ==============================
// DOWNLOAD PDF
// ==============================

function downloadResume() {

    const element = document.getElementById("downloadArea");

    if (!element) {
        alert("Generate resume first.");
        return;
    }

    if (typeof html2pdf === "undefined") {
        alert("PDF library not loaded.");
        return;
    }

    html2pdf().from(element).save("Generated_Resume.pdf");
}


// ==============================
// LOADING
// ==============================

function showLoading(text) {
    document.getElementById("loading").classList.remove("hidden");
    document.getElementById("loadingText").innerText = text;
}

function hideLoading() {
    document.getElementById("loading").classList.add("hidden");
}