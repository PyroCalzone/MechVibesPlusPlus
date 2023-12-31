# Mechvibes++ Known Issues


## No soundpacks showing up after fresh install

### On Windows
- Download [Visual C++](https://aka.ms/vs/16/release/vc_redist.x64.exe)
	- If it says error, _READ THE INFO!_ It may already be installed!
-  Restart Mechvibes++
-  Restart your computer.

### On macOS
- Go to Privacy in System Settings
- Check for Mechvibes++ in any of the categories and enable any permissions
- Restart Mechvibes++

## No soundpacks showing up after adding a soundpack

In most cases, this bug happens if you have incorrectly added a soundpack.  Below is a list with things that can cause this bug to occur.

**Known Causes**

- Adding / leaving an empty folder in mechvibes_custom 
- Having a folder inside a folder  
- Touching the config.json. 
- Having the .zip or .rar files in mechvibes_custom

**If all else fails**

Sometimes the custom folder just- breaks.

How to fix this: 
Remove the entire folder and reload. A new one will automatically be created for you once you restart the app.