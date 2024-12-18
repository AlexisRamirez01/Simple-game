"""In this module we save the game with the points of the player/s"""

import os

#In this declaration of game_save() we have create and write the file contains the data game
def game_save(two_or_one, points):
    #Search the directory path
    directory_path = os.path.dirname(__file__)

    #Is a single or multiplayer game?
    if two_or_one == 1:
        #Case A: single game
        name_player = input("Please enter your name: ")
        #Create the path of the file
        file_name = os.path.join(directory_path, "single_game.txt")
        #Write the file with the data
        with open(file_name, "w") as archivo:
            archivo.write(f"{name_player},{points[0]}\n")
    #Case B: multiplayer game
    else:
        name_player1 = input("Please enter the name of the player 1: ")
        name_player2 = input("Please enter the name of the player 2: ")
        #Create the path of the file
        file_name = os.path.join(directory_path, "multiplayer_game.txt")
        #Write the file with the data
        with open(file_name, "w") as archivo:
            archivo.write(f"{name_player1},{points[0]}\n")
            archivo.write(f"{name_player2},{points[1]}\n")
    return 0

#In this declaration we can load the game of the players
def load_game(file_name):
    #Search the file path
    directory_path = os.path.dirname(__file__)
    file_path = os.path.join(directory_path, file_name)

    #Build an array with the info of the players
    players = []
    try:
        with open(file_path, "r") as archivo:
            for linea in archivo:
                # Read the info. of the file
                dato = linea.strip().split(",")
                # Build the struct of the player
                player = {
                    "N": dato[0],  # Name player
                    "P": int(dato[1])  # Points of the player
                }
                players.append(player)
        return players
    except FileNotFoundError:
        print("The file of data has been deleted.\n")
        return []



#This function is to debugg the code
def player_dump(players):
    for player in players:
        print(f"{player['N']:<16}", f"{player['P']:<6}")
    return 0