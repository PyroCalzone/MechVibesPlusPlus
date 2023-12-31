# Mechvibes++ FAQ
## Linux and macOS

Linux and macOS are not publicly availible.

This is because we need to have a machine running one of these operating systems to make a version for it.

## Can I make a version myself?

Yes, you can! 

**What you'll need**

- [Visual Studio Code](https://code.visualstudio.com/)
- [Node JS] (https://nodejs.org/)
- A machine running your desired OS 
	- For example, if you're trying to build a Mac version, you'll need a Mac.
- Knowledge in JavaScript
	- So you can fix any issues in the code preventing the app from running on your OS

## How to do it?

Follow these steps after installing both NodeJS and Visual Studio Code

1. Download the Mechvibes [source code](https://github.com/hainguyents13/mechvibes)
2. Download the Mechvibes++ [source code](https://github.com/PyroCalzone/MechVibesPlusPlus)
3. Replace the **src** folder in the Mechvibes source code with the **src** folder from Mechvibes++
4. Open the Mechvibes folder in **Visual Studio Code**
5. At the top, click **Terminal** then **New Terminal**
6. Run this command in the new terminal: **npm i**
7. If you're building for **Linux**, run **npm run build:linux**
8. If you're building for **macOS**, run **npm build:mac**
9. Wait for the compile to finish, this may take a while.
10. Run the app and fix any issues  using the developer console to check for errors.

If you can't figure anything out, you can resort to our [Discord](https://discord.gg/CZ8Qgth2SW/) server for help. Remember that we don't own these machines ourselves and may not entirely be available to assist.
