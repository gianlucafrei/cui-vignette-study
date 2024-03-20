var counter = 0;
const counterTotal = 25;

function resetPair(){

    vignetteA = document.getElementById("vignetteA");
    vignetteB = document.getElementById("vignetteB");

    vignetteA.innerHTML = '';
    vignetteB.innerHTML = '';
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

function updateCounter(){

    elem = document.getElementById("pageIndex")
    elem.innerText = counter + "/" + counterTotal;
}

function loadNewPair(){

    console.log("Loading new pair")
    counter += 1

    fetch('https://trust-cui-study.azurewebsites.net/api/get_pair')
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
        // Process the data
        console.log('Success:', data);
        resetPair()

        questionA = data.first.question1;
        answerA = data.first.instance1;

        questionB = data.second.question2;
        answerB = data.second.instance2;

        // Example of accessing parts of the data:
        console.log('First Instance:', answerA);
        console.log('First Question:', questionA);
        console.log('Second Instance:', answerB);
        console.log('Second Question:', questionB);

        // Add to Dom
        vignetteA = document.getElementById("vignetteA");
        renderInstance(questionA, answerA, vignetteA);

        vignetteB = document.getElementById("vignetteB");
        renderInstance(questionB, answerB, vignetteB);

        // Also update counter
        updateCounter()

    })
    .catch(error => {
        // Handle any errors that occurred during the fetch
        console.error('There was a problem with your fetch operation:', error);
    });

}

loadNewPair()

document.addEventListener('DOMContentLoaded', function() {

    // Attach click event listeners to each vignette
    const vignettes = document.querySelectorAll('.vignette');
    vignettes.forEach(function(vignette) {
        vignette.addEventListener('click', function() {
            // Retrieve the selected vignette's identifier ('A' or 'B')
            const selectedVignette = this.id.replace('vignette', '');


            vignette.classList.add('clicked');
            setTimeout(() => {
                vignette.classList.remove('clicked');
            }, 500);

            loadNewPair();
        });
    });
});