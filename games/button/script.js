const btn = document.getElementById("BTN");
const heading = document.getElementById("heading");
const body1 = document.getElementById("B")
const restartBtn = document.getElementById("restart");
const sounds = {
    miss: new Audio("miss.mp3"),
    click: new Audio("click.mp3"),
    achievement: new Audio("achievement.mp3")
};

function playSound(sound){
    sound.currentTime = 0;
    sound.play();
}

const colors = ["maroon", "Red", "Orange", "yellow", "Green","yellowgreen", "chartreuse", "Lime", "LightBlue", "blue", "pink", "purple", "black", "grey", "white"]
const buttonTexts = [
    "You missed!",
    "Over here!",
    "Too slow!",
    "Catch me!",
    "Not today!",
    "Try again!",
    "Missed me 😎",
    "Almost!",
    "Wrong spot!",
    "You'll never catch me!",
    "You can click me!"
];
const buttonTexts2 = [
    "You missed!",
    "Over here!",
    "Too slow!",
    "Catch me!",
    "Not today!",
    "Try again!",
    "Missed me 😎",
    "Almost!",
    "Wrong spot!",
    "You'll never catch me!",
    "You can click me!",
    "Behind you!",
    "Skill issue!",
    "Nice try!",
    "Keep chasing!",
    "Can't touch this!",
    "Getting warmer...",
    "404: Button Not Found",
    "Are you even trying?",
    "Zoom!",
    "Nope."
];
const buttonTexts3 = [
    "Behind you!",
    "Skill issue!",
    "Nice try!",
    "Keep chasing!",
    "Can't touch this!",
    "Getting warmer...",
    "404: Button Not Found",
    "Are you even trying?",
    "Zoom!",
    "Nope."
];
const buttonTexts100 = [
    "100 misses?! That's impressive.",
    "The button is your owner now.",
    "Achievement Unlocked: Professional Misser 🏆",
    "Have you considered using a larger cursor?",
    "The button thanks you for the exercise.",
    "100 misses and still going?! 😶‍🌫️",
    "Legend says nobody has ever missed this much.",
    "At this point, we're both committed.",
    "The button has filed a restraining order.",
    "Skill issue detected. 🚨",
    "💀Congratulations! You found the secret ending.",
    "👑You are officially the Miss Master.",
    "🤖 The button is learning from your mistakes.",
    "🏃 The button has evolved into a faster species.",
    "📜 100 misses. Future generations will study this moment."
];

let r = 0;
let g = 0;
let b = 0;
let missed = 0;
let move = true;
let topMargin = window.innerHeight - 20;
let leftMargin = window.innerWidth - 20;

document.body.addEventListener("click", () => {
    sounds.miss.play().then(() => {
        sounds.miss.pause();
        sounds.miss.currentTime = 0;
    }).catch(() => {});
}, { once: true });

btn.addEventListener("mouseover", () => {
    if (move){
        missed ++;
        playSound(sounds.miss);
        heading.textContent = "You Missed The Button " + missed + " Times!"
        randomNum = Math.round(Math.random()*colors.length);
        randomNum2 = Math.round(Math.random()*colors.length);
        randomNum3 = Math.round(Math.random()*colors.length);
        randomNum4 = Math.round(Math.random()*colors.length);
        randomNum5 = Math.round(Math.random()*colors.length);
        while (randomNum == randomNum2){
            randomNum2 = Math.round(Math.random()*colors.length);       
        }
        btn.style.marginLeft =  Math.random()*leftMargin + "px";
        btn.style.marginTop =  Math.random()*topMargin+ "px";
        if(missed >= 5){
            btn.style.color = colors[randomNum2];
            if (missed < 30){
                const randomText = buttonTexts[Math.floor(Math.random() * buttonTexts.length)];
                btn.textContent = randomText;
            }
        }
        if(missed >= 10){
            btn.style.backgroundColor = colors[randomNum];
            btn.style.fontSize = Math.random()*50 + "px";
        }
        if(missed >= 15){
            btn.style.width = (Math.random()*300 + 20) + "px";
            btn.style.height = (Math.random()*300 + 20) + "px";
        }
        if(missed >= 20){
            heading.style.backgroundColor = colors[randomNum4];
            heading.style.color = colors[randomNum5];
        }
        if(missed >= 25){
            body1.style.backgroundColor = colors[randomNum3];
            
        }
        if(missed >= 30){
            btn.style.transform = `rotate(${Math.random()*360}deg)`;
            const randomText2 = buttonTexts2[Math.floor(Math.random() * buttonTexts2.length)];
            btn.textContent = randomText2;
        }
        if(missed >= 40 && missed < 100){
            const randomText3 = buttonTexts3[Math.floor(Math.random() * buttonTexts3.length)];
            btn.textContent = randomText3;
        }
        if (missed == 67){
            btn.textContent = 67;
        }
        if(missed >= 100 && missed < 200){
            const randomText100 = buttonTexts100[Math.floor(Math.random() * buttonTexts100.length)];
            btn.textContent = randomText100;
        }
        if(missed >= 200){
            btn.textContent = "Fine. You Win. Click me.";
            btn.style.color = "black";
            // btn.textContent = "You Can Click Me!";
            btn.style.backgroundColor = "white";
            btn.style.width = '140px';
            btn.style.height = 'auto';
            btn.style.marginLeft = '50vw';
            btn.style.marginTop = '50vh';
            btn.style.transform = "rotate(0deg)";
            btn.style.fontSize = '14px';
        }
        if(missed == 404){
            btn.textContent = "ERROR 404";
        }
    }
});

//WIN
btn.addEventListener('click', () => {
    playSound(sounds.click);
    heading.textContent = "You Clicked It After "+ missed + " Attempts!";
    btn.textContent = "You clicked me!"
    move = false;
    restartBtn.style.display = 'block';
    

})
// RESET
restartBtn.addEventListener('click', ()=>{
    missed = 0;
    btn.style.color = "black";
    btn.textContent = "You Can Click Me!";
    btn.style.backgroundColor = "white";
    btn.style.width = '140px';
    btn.style.height = 'auto';
    btn.style.marginLeft = '50vw';
    btn.style.marginTop = '50vh';
    btn.style.transform = "rotate(0deg)";
    btn.style.fontSize = '14px';
    heading.style.backgroundColor = "white";
    heading.style.color = "black";
    move = true;
    restartBtn.style.display = 'none';
    heading.textContent = "";
    body1.style.backgroundColor = 'white';
})
