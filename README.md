Frontend - IslandGameFront

This frontend project is built with Angular and provides the user interface for the Island Game. Players can interact with a grid map to find the island with the highest average height.
Project Overview

The Island Game allows users to:
    View a 30x30 grid map with water and land cells. Each cell has a height, and groups of connected land cells form islands.
    Guess which island has the highest average height by clicking on any cell within the island.
    Make up to three guesses to find the correct island, after which the game ends, allowing a restart.

How to Play
    Access the game by running it on http://localhost:80 if running from docker compose, and localhost:4200 if running in local.
    Click on any cell in the grid map to select an island. The game will:
        Highlight the selected island.
        Compare its average height to the correct answer.
        Track guesses, ending the game after three incorrect guesses or a correct guess.
    After the game ends, click "Restart" to try again.

Tech Stack
    Angular: Manages dynamic UI, game logic, and user interactions.
    REST API Calls: Communicates with the backend to receive map data and process guesses.
    Docker: Deploys easily alongside the backend using the docker-compose.yml setup.


![image](https://github.com/user-attachments/assets/cef02ca4-ee40-4f86-8a47-eccfcb1d36ab)
![image](https://github.com/user-attachments/assets/bf3e0e96-ee08-4aea-8e8e-499779ec6ce1)
![image](https://github.com/user-attachments/assets/2a164ef0-a3fd-49ba-b0d8-87decdcda354)
