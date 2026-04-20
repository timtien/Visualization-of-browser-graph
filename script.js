'use strict';

const fetchJoke = async () => {
    try {
        const response = await fetch('https://v2.jokeapi.dev/joke/Any');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const jokeData = await response.json();
        if (jokeData.type === 'single') {
            console.log(jokeData.joke);
        } else {
            console.log(`${jokeData.setup} - ${jokeData.delivery}`);
        }
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
};

fetchJoke();
