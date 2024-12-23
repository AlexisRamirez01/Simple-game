""" In this module we define the game """
import random
import getpass #library for no visible data in shell

#Selector of the type of the game
def select_mode(game_option):
    if game_option == "Single game":
        player_data = single_game()
    elif game_option == "Multiplayer game":
        player_data = multiplayer()
    return player_data

#Single game logic
def single_game():
    points = 0
    list = ["Paper", "Rock", "Scissors"]
    #First select the mode of the single game
    name_player = input("Please enter your name: ")
    mode = input("Select the arcade mode or training mode: ")
    if mode == "Arcade":
        machine_win = False
        while(not(machine_win)):
            level = 1
            #Enter to the arcade mode
            player_choice = input("Please enter your choice: ")
            for i in range(level):
                machine_choice = random.choice(list)
            #Now the logic for the arcade game
            if player_choice == machine_choice:
                print("It's a draw.\n")
            elif (player_choice == list[0] and machine_choice == list[1]) or (player_choice == list[1] and machine_choice == list[2]) or (player_choice == list[2] and machine_choice == list[0]):
                print("Player is the winner.\n")
                level += 1
                points += 100
            else:
                print("The machine is the winner.\n")
                machine_win = True
        data_of_winner = [name_player, level, points]
        return data_of_winner
    else:
        difficult = int(input("Select the difficult for the training in range of 1 at 3: "))
        assert difficult >=1 and difficult <= 3, "Please enter a correct difficult.\n" 
        player_choice = input("Select your option: ")
        for i in range(difficult):
            machine_choice = random.choice(list, k=1)
        #Now the logic for the arcade game
        if player_choice == machine_choice:
            print("It's a draw.\n")
        elif (player_choice == list[0] and machine_choice == list[1]) or (player_choice == list[1] and machine_choice == list[2]) or (player_choice == list[2] and machine_choice == list[0]):
            print("Player is the winner.\n")
        else:
            print("The machine is the winner.\n")
        return 0
        
#Multiplayer game logic        
def multiplayer():
    end = False
    winner = ""
    list = ["Paper", "Rock", "Scissors"]
    print("Now please enter the name of the players.\n")
    name_player1 = input(">")
    name_player2 = input(">")
    while(not(end)):
        print("Now choice a option to begin the game.\n")
        choice_player1 = getpass.getpass(' ')
        choice_player2 = getpass.getpass(' ')
        #Now, it's time to decide the winner
        #Case: Draw
        if choice_player1 == choice_player2:
            print("This is a draw.\n")
        #Case: Player 1 win with paper vs rock
        elif choice_player1 == list[0] and choice_player2 == list[1]:
            winner = name_player1
            print(f"The winner is {winner}.\n")
        #Case: Player 1 win with scissors vs paper
        elif choice_player1 == list[2] and choice_player2 == list[0]:
            winner = name_player1
            print(f"The winner is {winner}.\n")
        #Case: Player 1 win with rock vs scissors
        elif choice_player1 == list[1] and choice_player2 == list[2]:
            winner = name_player1
            print(f"The winner is {winner}.\n")
        #Case: Player 2 win with paper vs rock
        elif choice_player2 == list[0] and choice_player1 == list[1]:
            winner = name_player2
            print(f"The winner is {winner}.\n")
        #Case: Player 2 win with scissors vs paper
        elif choice_player2 == list[2] and choice_player1 == list[0]:
            winner = name_player2
            print(f"The winner is {winner}.\n")
        #Case: Player 2 win with rock vs scissors
        elif choice_player2 == list[1] and choice_player1 == list[2]:
            winner = name_player2
            print(f"The winner is {winner}.\n")
        next_round = input("You want play again? ")
        if next_round == "No":
            end = True
    return 0
    
"""
The line 27 of the code can be modified with the next code:
    winning_conditions = {
    list[0]: list[1],  # list[0] vence a list[1]
    list[1]: list[2],  # list[1] vence a list[2]
    list[2]: list[0],  # list[2] vence a list[0]
}

if machine_choice == winning_conditions.get(player_choice):
    print("Player is the winner")
    level += 1
    points += 100
"""