"""
SchedulingTransformer - Main Entry Point
Run this to see all available options.
"""

import sys
import os

def print_menu():
    """Print main menu."""
    print("""
╔════════════════════════════════════════════════════════════════════════╗
║                   SCHEDULING TRANSFORMER - MAIN MENU                  ║
╚════════════════════════════════════════════════════════════════════════╝

This educational AI system simulates multi-agent negotiation using 
Transformers to find acceptable meeting times.

Available options:

  1. Run negotiation example
     → See a single negotiation with visualizations
     → Run: python examples/example_run.py

  2. Start API server
     → Run REST API for generation and negotiation
     → Run: python api/main.py
     → Test with: python examples/example_api.py

  3. Train the model
     → Train on synthetic scenarios
     → Generate satisfaction convergence plots
     → Run: python examples/example_training.py

  4. View documentation
     → See comprehensive project guide
     → Open: README.md

Choose an option (1-4) or 'q' to quit:
""")

def main():
    """Main entry point."""
    while True:
        print_menu()
        choice = input("Your choice: ").strip().lower()
        
        if choice == '1':
            print("\nRunning negotiation example...")
            os.system('python examples/example_run.py')
            input("\nPress Enter to continue...")
        
        elif choice == '2':
            print("\nStarting API server on http://localhost:8000")
            print("To test, open another terminal and run: python examples/example_api.py")
            os.system('python api/main.py')
        
        elif choice == '3':
            print("\nStarting training...")
            os.system('python examples/example_training.py')
            input("\nPress Enter to continue...")
        
        elif choice == '4':
            print("\nOpening README.md...")
            if sys.platform == 'win32':
                os.system('start README.md')
            elif sys.platform == 'darwin':
                os.system('open README.md')
            else:
                os.system('xdg-open README.md')
        
        elif choice == 'q':
            print("Goodbye!")
            break
        
        else:
            print("Invalid choice. Please try again.\n")

if __name__ == "__main__":
    main()
