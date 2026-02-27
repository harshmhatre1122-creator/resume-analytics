// ==========================
// RESUME ANALYZER PRO
// ==========================

async function analyzeResume() {

    const file = document.getElementById("resumeUpload").files[0];
    if (!file) return alert("Upload resume first!");

    document.getElementById("loading").classList.remove("hidden");
    document.getElementById("loadingText").innerText = "Parsing your resume...";

    const reader = new FileReader();

    reader.onload = async function () {

        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;

        let text = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            content.items.forEach(item => text += item.str + "\n");
        }

        setTimeout(() => generateReport(text), 1500);
    };

    reader.readAsArrayBuffer(file);
}


// ==========================
// GENERATE REPORT
// ==========================

function generateReport(text) {

    document.getElementById("loading").classList.add("hidden");
    document.getElementById("report").classList.remove("hidden");

    const lines = text.split("\n").map(l => l.trim()).filter(l => l);

    const name = detectName(lines);
    document.getElementById("candidateName").innerText = name;

    const summary = extractSection(text, "summary");
    const experience = extractSection(text, "experience");
    const education = extractSection(text, "education");
    const projects = extractSection(text, "projects");
    const skills = extractSection(text, "skills");
    const certifications = extractSection(text, "certifications");

    const skillList = extractSkills(skills);

    const projectCount = countProjects(projects);
    const experienceYears = detectExperienceYears(text);

    const score = calculateScore(projectCount, skillList.length, experienceYears);

    updateScoreUI(score, projectCount, skillList.length, experienceYears);
    generateIssues(projectCount, skillList.length, experienceYears);

    const resumeHTML = generateResumeTemplate(
        name,
        summary,
        experience,
        education,
        projects,
        skillList,
        certifications
    );

    document.getElementById("resumePreview").innerHTML = resumeHTML;
}


// ==========================
// NAME DETECTION
// ==========================

function detectName(lines) {

    for (let line of lines.slice(0, 5)) {
        if (/^[A-Z][A-Z\s]{3,}$/.test(line)) {
            return line;
        }
    }

    return "Candidate Name";
}


// ==========================
// SECTION EXTRACTION
// ==========================

function extractSection(text, sectionName) {

    const lines = text.split("\n").map(l => l.trim());

    let startIndex = -1;
    let endIndex = lines.length;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(sectionName.toLowerCase())) {
            startIndex = i;
            break;
        }
    }

    if (startIndex === -1) return "";

    for (let i = startIndex + 1; i < lines.length; i++) {
        if (/^[A-Z\s]{4,}$/.test(lines[i]) && lines[i].length < 40) {
            endIndex = i;
            break;
        }
    }

    return lines.slice(startIndex + 1, endIndex).join(" ");
}


// ==========================
// SKILL EXTRACTION
// ==========================

function extractSkills(skillText) {

    if (!skillText) return [];

    return skillText
        .split(/,|\n/)
        .map(s => s.replace(/\(.*?\)/g, "").trim())
        .filter(s => s.length > 2);
}


// ==========================
// PROJECT COUNT
// ==========================

function countProjects(projectText) {

    if (!projectText) return 0;

    const lines = projectText.split("\n").filter(l => l.length > 10);

    return lines.length;
}


// ==========================
// EXPERIENCE YEARS DETECTION
// ==========================

function detectExperienceYears(text) {

    const years = text.match(/20\d{2}/g);

    if (!years || years.length < 2) return 0;

    const yearNums = years.map(Number);

    return Math.max(...yearNums) - Math.min(...yearNums);
}


// ==========================
// SCORE CALCULATION
// ==========================

function calculateScore(projects, skills, experience) {

    let score = 0;

    if (projects >= 3) score += 30;
    if (skills >= 10) score += 30;
    if (experience >= 2) score += 20;

    score += 20; // base structure

    return Math.min(score, 100);
}


// ==========================
// UPDATE SCORE UI
// ==========================

function updateScoreUI(score, projects, skills, experience) {

    document.getElementById("scoreValue").innerText = score;

    document.getElementById("contentBar").style.width = score + "%";
    document.getElementById("sectionBar").style.width = projects * 10 + "%";
    document.getElementById("atsBar").style.width = skills * 5 + "%";
    document.getElementById("tailorBar").style.width = experience * 10 + "%";

    document.getElementById("parseProgress").style.width = "95%";
    document.getElementById("statusText").innerText =
        "Resume successfully parsed and analyzed.";
}


// ==========================
// ISSUE GENERATION
// ==========================

function generateIssues(projects, skills, experience) {

    const issues = document.getElementById("issuesList");
    issues.innerHTML = "";

    if (projects < 3) addIssue("Add more structured projects.");
    if (skills < 8) addIssue("Add more measurable skills.");
    if (experience < 2) addIssue("Quantify your experience duration.");

    if (issues.innerHTML === "") {
        addIssue("No major structural issues detected.");
    }
}


function addIssue(text) {

    const li = document.createElement("li");
    li.innerText = text;
    document.getElementById("issuesList").appendChild(li);
}


// ==========================
// MODERN 2-COLUMN RESUME TEMPLATE
// ==========================

function generateResumeTemplate(
    name,
    summary,
    experience,
    education,
    projects,
    skillList,
    certifications
) {

    const initials = name.split(" ")
        .map(n => n[0])
        .join("")
        .substring(0, 2);

    return `
    <div class="resume-modern" id="downloadArea">

        <div class="resume-header">
            <div>
                <h1>${name}</h1>
                <p class="title">Software Developer</p>
                <p class="contact">📞 +91 XXXXX XXXXX | ✉ example@email.com</p>
            </div>
            <div class="avatar">${initials}</div>
        </div>

        <div class="resume-body">

            <div class="left-column">

                <h3>SUMMARY</h3>
                <p>${summary || "Summary not detected."}</p>

                <h3>EXPERIENCE</h3>
                <p>${experience || "Experience not detected."}</p>

                <h3>EDUCATION</h3>
                <p>${education || "Education not detected."}</p>

            </div>

            <div class="right-column">

                <h3>CERTIFICATIONS</h3>
                <p>${certifications || "Certifications not detected."}</p>

                <h3>SKILLS</h3>
                <div class="skill-tags">
                    ${skillList.map(skill => `<span>${skill}</span>`).join("")}
                </div>

                <h3>PROJECTS</h3>
                <p>${projects || "Projects not detected."}</p>

            </div>

        </div>
    </div>
    `;
}


// ==========================
// DOWNLOAD PDF
// ==========================

function downloadResume() {

    const element = document.getElementById("downloadArea");

    const opt = {
        margin: 0.5,
        filename: 'Generated_Resume.pdf',
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
}