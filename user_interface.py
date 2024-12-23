""" In this module we build the user interface of the game """

import save
import game

def main():
    quit = False
    while(not(quit)):
        print("Welcome to Rock, Paper or Scissors shell videogame.\n")
        print("Now you can select a option to start: Single game, Multiplayer game, Credits or Quit")
        game_option = input(">> ")
        if game_option == "Quit":
            print("Thank you to play my game. See later!!!")
            quit = True
        elif game_option == "Credits":
            print(
                "This game has been created of Diego Alexis Ramirez, yes I'm. So I'm a student of Computer Science in Famaf.\n"
                "In this case, this videogame are a simple proyect to learn the basic's things of Python.\n"
                )
        else:
            player = game.select_mode(game_option)
            if game_option == "Single game":
                loading = input("You want to load a save game? ")
                if loading == "Yes":
                    save.load_game("single_game.txt")
                game_mode = 1
                saving = input("You want save the game? ")
                if saving == "Yes":
                    save.game_save(game_mode, player)
            else:
                player = game.select_mode(game_option)
    return 0

main()
        
        
                
                
