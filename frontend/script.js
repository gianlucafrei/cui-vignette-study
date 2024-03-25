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
    elem.classList.add(clazz);
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

function renderInstance(question, answer, vignetteContainer){

    vignetteContainer.innerHTML = '';
    //vignetteContainer.appendChild(create_element_with_text(null, "div", "chatLogo"));

    vignetteContainer.appendChild(createSvgWithUrl("images/person-svgrepo-com.svg", 25, 25, "chatLogo"));
    containerQuestion = create_element_with_text(null, "div", "chatContainer")
    containerQuestion.appendChild(create_element_with_text("You", "div", "chatName"));
    containerQuestion.appendChild(create_element_with_text(question, "div", "chatContent"));
    vignetteContainer.appendChild(containerQuestion);


    vignetteContainer.appendChild(createSvgWithUrl("images/machine-learning-solid-svgrepo-com.svg", 25, 25, "chatLogoRobot"));
    containerAnswer = create_element_with_text(null, "div", "chatContainer")
    containerAnswer.appendChild(create_element_with_text("Chatbot", "div", "chatName"));
    containerAnswer.appendChild(create_element_with_text(answer, "div", "chatContent"));
    vignetteContainer.appendChild(containerAnswer);
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


document.addEventListener('DOMContentLoaded', function() {

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
});

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

init(function(){
    openModal("Welcome to the Study <b>Trust in Chatbots</b> from the School of Computer Science at the University of St. Gallen.<br>There will be "+model.totalQuestions+" questions.<br><br>Please read the output of both chatbots and select the chatbot answer that you think is less likely to be wrong.")
});


