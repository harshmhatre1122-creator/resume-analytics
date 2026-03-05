async function analyzeResume(){

const file=document.getElementById("resumeUpload").files[0];

if(!file){
alert("Upload resume first");
return;
}

showLoading();

const text=await extractPDF(file);

generateReport(text);

hideLoading();

}


async function extractPDF(file){

const reader=new FileReader();

return new Promise((resolve)=>{

reader.onload=async function(){

const typed=new Uint8Array(this.result);

const pdf=await pdfjsLib.getDocument(typed).promise;

let text="";

for(let i=1;i<=pdf.numPages;i++){

const page=await pdf.getPage(i);

const content=await page.getTextContent();

content.items.forEach(item=>{
text+=item.str+" ";
});

}

resolve(text);

};

reader.readAsArrayBuffer(file);

});

}


function generateReport(text){

document.getElementById("dashboard").classList.remove("hidden");

const skills=extractSkills(text);

const experience=detectExperience(text);

const projects=detectProjects(text);

const score=calculateScore(skills.length,projects,experience);

document.getElementById("scoreValue").innerText=score;

document.getElementById("skillCount").innerText=skills.length;

document.getElementById("projectCount").innerText=projects;

document.getElementById("experienceYears").innerText=experience+" yrs";

renderSkills(skills);

generateIssues(projects,skills.length,experience);

generateResume(text);

createCharts(skills, experience, projects, score);

}


function extractSkills(text){

const keywords=[
"javascript","react","node","python","java","sql","html","css",
"mongodb","express","docker","linux","aws","git","power bi"
];

const lower=text.toLowerCase();

return keywords.filter(skill=>lower.includes(skill));

}


function detectExperience(text){

const years=text.match(/20\d{2}/g);

if(!years||years.length<2)return 0;

const nums=years.map(Number);

return Math.max(...nums)-Math.min(...nums);

}


function detectProjects(text){

const count=(text.match(/project/gi)||[]).length;

return count;

}


function calculateScore(skills,projects,experience){

let score=40;

score+=skills*4;

score+=projects*5;

score+=experience*3;

if(score>100)score=100;

return score;

}


function renderSkills(skills){

const box=document.getElementById("skillsList");

box.innerHTML="";

skills.forEach(skill=>{

const span=document.createElement("span");

span.innerText=skill.toUpperCase();

box.appendChild(span);

});

}


function generateIssues(projects,skills,experience){

const list=document.getElementById("issuesList");

list.innerHTML="";

if(projects<2)addIssue("Add more projects");

if(skills<5)addIssue("Add more technical skills");

if(experience<1)addIssue("Add measurable experience");

if(list.innerHTML==="")addIssue("Resume structure looks good");

}


function addIssue(text){

const li=document.createElement("li");

li.innerText=text;

document.getElementById("issuesList").appendChild(li);

}

function generateResume(text){

const name = text.split("\n")[0];

const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

const phone = text.match(/\+?\d[\d\s\-]{8,}/);

const skills = extractSkills(text);

document.getElementById("resumePreview").innerHTML=`

<div class="resume-modern" id="downloadArea">

<div class="resume-header">

<h1>${name}</h1>

<div class="contact">

<p>${email ? email[0] : ""}</p>
<p>${phone ? phone[0] : ""}</p>

</div>

</div>

<h3>Skills</h3>

<div class="skills">

${skills.map(s=>`<span>${s}</span>`).join("")}

</div>

<h3>Resume Content</h3>

<p>${text.substring(0,1200)}</p>

</div>

`;

}


function downloadResume(){

const element=document.getElementById("resumePreview");

html2pdf().from(element).save("GeneratedResume.pdf");

}


function showLoading(){

document.getElementById("loading").classList.remove("hidden");

}

function hideLoading(){

document.getElementById("loading").classList.add("hidden");

}

function createCharts(skills, experience, projects, score){

new Chart(document.getElementById("skillsChart"),{
type:"bar",
data:{
labels:skills,
datasets:[{
label:"Skill Match",
data:skills.map(()=>Math.floor(Math.random()*100)),
backgroundColor:"#22c55e"
}]
}
});

new Chart(document.getElementById("experienceChart"),{
type:"line",
data:{
labels:["Start","Mid","Current"],
datasets:[{
label:"Experience Growth",
data:[1,experience/2,experience],
borderColor:"#4ade80",
fill:false
}]
}
});

new Chart(document.getElementById("scoreChart"),{
type:"doughnut",
data:{
labels:["Score","Remaining"],
datasets:[{
data:[score,100-score],
backgroundColor:["#22c55e","#1f2937"]
}]
}
});

}