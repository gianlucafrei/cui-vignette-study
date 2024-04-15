const api = "https://trust-cui-study.azurewebsites.net/api"
const model = {
    
    pair: null,
    experimentName: null,
    prolific_pid: null,
    prolific_study_id: null,
    prolific_session_id: null,
    counter: 0,
    startTime: Date.now(),
    currentPairLoadingTime: null,
    totalQuestions: null,
    redirectUrl: null,
    attentionCheck: false,
    attentionCheckDone: false,
    attentionCheckCorrectAnswer: null
}

function randomAorB(){

    if(Math.random() < 0.5){
        return "A";
    }
    return "B";
}

function create_element_with_text(text, type, clazz){

    const elem = document.createElement(type);
    elem.textContent = text;

    clazz.split(" ").forEach(c => elem.classList.add(c));
    
    return elem;
}

function createSvgWithUrl(url, width, height, clazz) {

    // Create the SVG element
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  
    // Create an image element inside the SVG
    const image = document.createElementNS(svgNS, "image");
    image.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
    image.setAttribute("width", width);
    image.setAttribute("height", height);
  
    // Append the image to the SVG
    svg.appendChild(image);
    svg.classList.add(clazz);
  
    // Return the SVG element
    return svg;
  }

function createTypewriterEffect(element, baseSpeed, speedVariation, then) {

const text = element.innerText;
element.innerText = "";

var i = 0;
var isBeginningOfWord = true; // Flag to check if we're at the beginning of a new word
var randomSpeed = baseSpeed; // Start with the base speed

function typeWriter() {
    if (i < text.length) {
    // Check if the current character is a space or if we're at the start
    if (isBeginningOfWord) {
        // Adjust the random speed for the next word
        randomSpeed = speedVariation + Math.random() * 100;
        isBeginningOfWord = false; // Reset the flag
    }
    
    // Add the current character to the HTML
    element.innerHTML += text.charAt(i);
    
    // Check if the next character is a space or if we're at the end
    if (text.charAt(i + 1) === ' ' || i === text.length - 1) {
        isBeginningOfWord = true; // The next character will be the start of a new word
    }
    
    i++; // Move to the next character
    setTimeout(typeWriter, randomSpeed);
    }else{

        if(then){then();}
    }
}

typeWriter(); // Start the typewriter effect
}

function createSkelletonEffect(element){

    const randomSpeed = 5000 * Math.random();

    const innerHtml = element.innerHTML;
    element.innerHTML = '<div class="skeleton skeleton-text1"></div><div class="skeleton skeleton-text2"></div><div class="skeleton skeleton-text3"></div>';


    setTimeout(function(){
        
        element.innerHtml = innerHtml;

    }, randomSpeed)
}

function highlightUncertainText(div) {
    const text = div.innerText;
    const words = text.split(/\s+/);

    // Calculate start point and check if total words are less than 10
    let start = 0;
    let end = words.length;

    if (words.length >= 10) {
        // Random starting point from 0 to length - 10 so that at least 10 words are included
        start = Math.floor(Math.random() * (words.length - 10));
        end = start + 10;
    }

    // Join the words to form the highlighted and non-highlighted parts
    const beforeHighlight = words.slice(0, start).join(' ');
    const highlightText = words.slice(start, end).join(' ');
    const afterHighlight = words.slice(end).join(' ');

    // Rebuild the content with highlight
    div.innerHTML = `
    ${beforeHighlight}
    <span title="Uncertain Answer" class="highlight">${highlightText}</span>
    <span title="Uncertain Answer" class="highlight-description">!</span>
    ${afterHighlight}
    <br><span title="" class="highlight-description-text">This answer contain uncertain parts.</span>`;
}

function renderInstance(question, answer, vignetteContainer){

    vignetteContainer.innerHTML = '';
    //vignetteContainer.appendChild(create_element_with_text(null, "div", "chatLogo"));

    const userLogoElem = vignetteContainer.appendChild(createSvgWithUrl("images/person-svgrepo-com.svg", 25, 25, "chatLogo"));
    containerQuestion = create_element_with_text(null, "div", "chatContainer")
    containerQuestion.appendChild(create_element_with_text("You", "div", "chatName"));
    containerQuestion.appendChild(create_element_with_text(question, "div", "chatContent question"));
    vignetteContainer.appendChild(containerQuestion);

    if(vignetteContainer.classList.contains('humanLike')){

        aiAvatarUrl = "images/person-svgrepo-com.svg";
        aiAvatarName = "Laura";
    }else{

        aiAvatarUrl = "images/machine-learning-solid-svgrepo-com.svg";
        aiAvatarName = "Chatbot";
    }

    const aiLogoElem = vignetteContainer.appendChild(createSvgWithUrl(aiAvatarUrl, 25, 25, "chatLogoRobot"));
    containerAnswer = create_element_with_text(null, "div", "chatContainer")
    containerAnswer.appendChild(create_element_with_text(aiAvatarName, "div", "chatName"));

    chatContentElem = create_element_with_text(answer, "div", "chatContent answer");
    containerAnswer.appendChild(chatContentElem);
    vignetteContainer.appendChild(containerAnswer);


    createHighlight = function(){
        
        if(vignetteContainer.classList.contains('indicationOfUncertainty')){

            highlightUncertainText(chatContentElem);
        }
    }

    if(vignetteContainer.classList.contains('fastOutputSpeed')){

        createTypewriterEffect(chatContentElem, 0, 0, createHighlight);

    }else{

        //createSkelletonEffect(chatContentElem);
        createHighlight();
    }
}

function renderModel(){

     // Render Vignettes
    const elemVignetteA = document.getElementById("vignetteA");
    const elemVignetteB = document.getElementById("vignetteB");
    
    elemVignetteA.innerHTML = '';
    elemVignetteB.innerHTML = '';

    renderInstance(model.pair.first.question,  model.pair.first.instance,  elemVignetteA);
    renderInstance(model.pair.second.question, model.pair.second.instance, elemVignetteB);

    // Render counter
    elem = document.getElementById("pageIndex")
    elem.innerText = model.counter + "/" + model.totalQuestions;
}

function loadNewPair(then){

    console.log("Loading new pair")

    fetch(api + '/get_pair')
    .then(response => {
        // Check if the response is ok (status in the range 200-299)
        if (!response.ok) {
        // Throw an error if the server response was not ok
        throw new Error('Network response was not ok');
        }
        // Parse the JSON response body
        return response.json();
    })
    .then(data => {


        model.pair = data;
        model.counter += 1;
        model.currentPairLoadingTime = Date.now();
        model.totalQuestions = data.totalQuestions;
        model.redirectUrl = data.redirectUrl;
        model.attentionCheck = false;
        
        renderModel();

        if(then){then()}

    })
    .catch(error => {
        // Handle any errors that occurred during the fetch
        console.error('There was a problem with your fetch operation:', error);
    });
}


function saveResult(selectedVignette) {
    
    answerDuration = Date.now() - model.currentPairLoadingTime;
    totalDuration = Date.now() - model.startTime;

    const params = new URLSearchParams({
        experiment: model.experimentName,
        instance1: model.pair.first.s,
        instance2: model.pair.second.s,
        vignette1: model.pair.first.v,
        vignette2: model.pair.second.v,
        selectedVignette: selectedVignette,
        answerDuration: answerDuration,
        totalDuration: totalDuration,
        prolific_pid: model.prolific_pid,
        prolific_study_id: model.prolific_study_id,
        prolific_session_id: model.prolific_session_id,
        counter: model.counter
    });

    if(model.attentionCheck){

        params.append("attentionCheck", selectedVignette == model.attentionCheckCorrectAnswer);
        
    }else{

        params.append("attentionCheck", "");
    }

    fetch(`https://trust-cui-study.azurewebsites.net/api/save_response?${params}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(data => {
        console.log('Success:', data);
        // Handle success, such as indicating to the user that their selection was saved
    })
    .catch(error => {
        console.error('There was a problem with your fetch operation:', error);
        // Handle error, such as showing an error message to the user
    });
}

function init(then){

    // Init participant id and experiment id from url
    const urlParams = new URLSearchParams(window.location.search);

    model.experimentName = urlParams.get("experiment");
    model.prolific_pid = urlParams.get("PROLIFIC_PID");
    model.prolific_study_id = urlParams.get("STUDY_ID");
    model.prolific_session_id = urlParams.get("SESSION_ID");

    loadNewPair(then)
}

function attentionCheck(){

    model.attentionCheckCorrectAnswer = randomAorB();


    model.pair.first.question = "Are blueberries blue?";
    model.pair.second.question = "Are blueberries red?";

    const correctAnswer = "Blueberries appear blue without a blue pigment. This is an attention check. Please select this answer.";
    const wrongAnswer = "If you open up a ripe blueberry, the blue skin on its outside does not match the dark, reddish purple color inside of the fruit. However, their skin does not actually contain blue pigments, which would normally be creating this color. This is an attention check. Please select the other answer.";

    if (model.attentionCheckCorrectAnswer == "A"){

        model.pair.first.instance = correctAnswer;
        model.pair.second.instance = wrongAnswer;

    }else{

        model.pair.first.instance = wrongAnswer;
        model.pair.second.instance = correctAnswer;
    }
    
    model.attentionCheck = true;
    renderModel();
}


function openModal(text, onclose){

    var modal = document.getElementById("myModal");
    var modalTextElem = document.getElementById("modalText");
    var span = document.getElementsByClassName("close")[0];

    modal.style.display = "block";

    span.onclick = function() {
        modal.style.display = "none";

        if (onclose){
            onclose()
        }
    }

    modalTextElem.innerHTML = text;

}

function main(){

    init(function(){
        openModal("Welcome to the Study <b>Trust in Chatbots</b> from the School of Computer Science at the University of St. Gallen.<br>There will be "+model.totalQuestions+" questions.<br><br>Please read the output of both chatbots and select the chatbot answer that you think is less likely to be wrong.")
    });

    // Attach click event listeners to each vignette
    const vignettes = document.querySelectorAll('.vignette');
    vignettes.forEach(function(vignette) {

        vignette.addEventListener('click', function() {

            // Retrieve the selected vignette's identifier ('A' or 'B')
            const selectedVignette = this.id.replace('vignette', '');

            // Save result
            saveResult(selectedVignette)


            if(model.counter >= model.totalQuestions){

                if(model.attentionCheckDone){

                    // Finish Survey
                    const callbackLink = model.redirectUrl;
                    openModal("Thank you for participating. Please click on the following link to return to Prolific: <a href="+callbackLink+">"+callbackLink+"</a>");

                }
                else{

                    // Execute Attention Check
                    model.attentionCheckDone = true;
                    attentionCheck();
                }
                
            }
            else{

                // Load new pair
                loadNewPair();
            }

            

            // click animation
            vignette.classList.add('clicked');
            setTimeout(() => {
                vignette.classList.remove('clicked');
            }, 500);

        });
    });
}

function showVignettes(){

    var vignettes = document.getElementsByClassName("vignette");

    factors = [
        ["instantOutputSpeed", "fastOutputSpeed"],
        ["modern", "outdated"],
        ["machineLike", "humanLike"],
        ["noIndicationOfUncertainty", "indicationOfUncertainty"],
    ] 

    const question = "Are blueberries red?";
    const answer = "If you open up a ripe blueberry, the blue skin on its outside does not match the dark, reddish purple color inside of the fruit. However, their skin does not actually contain blue pigments, which would normally be creating this color.";

    for (var i = 0; i < vignettes.length; i++) {

        const vignetteElem = vignettes[i];
        const indices = vignetteElem.className.match(/\((.*?)\)/)[1].split(',').map(Number);
        console.log(indices)

        const factorClasses = indices.map((index, factorIndex) => factors[factorIndex][index]);
        vignetteElem.classList.add(...factorClasses);

        const paint = function(){

            renderInstance(question, answer, vignetteElem);
            const descriptionElem = create_element_with_text(factorClasses, "div", "vignetteDescription")
            vignetteElem.appendChild(descriptionElem);
        }

        paint();

        // Adding a click event listener to re-render on click
        vignetteElem.addEventListener('click', () => {
            
            paint();
            
            // click animation
            vignetteElem.classList.add('clicked');
            setTimeout(() => {
                vignetteElem.classList.remove('clicked');
            }, 500);
            });

    }
}


document.addEventListener('DOMContentLoaded', function() {

    if(window.location.pathname.endsWith("vignettes.html")){
        showVignettes();
    }
    else{
        main();
    }
});


