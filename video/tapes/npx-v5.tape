# Real run, one take: Hearsay from npm in an add-on's own project, the intended way to use it.
# The project holds only its tests (suites/kitchen.yaml and its recorded mishearings); the add-on
# is the Kitchen demo server, already running on localhost:4101. Film v5.1.
#   HEARSAY_DIR=<a clone, for the demo server> ADDON_DIR=<a folder named kitchen-addon with suites/> vhs tapes/npx-v5.tape
Source tapes/common-4k.tape
Set FontSize 40
Output out/tapes/npx-v5.mp4
Hide
Type `(cd "$HEARSAY_DIR" && npm run -s server:kitchen > /dev/null 2>&1 &); until curl -s -o /dev/null localhost:4101/mcp; do sleep 0.2; done`
Enter
Type `cd "$ADDON_DIR" && rm -rf reports && export PS1='\W $ ' && clear`
Enter
Wait /kitchen-addon \$$/
Show
Sleep 400ms
Type "sed -n '/- id: start-pasta-timer/,/spokenIncludes/p' suites/kitchen.yaml"
Enter
Sleep 2.5s
Type "npx -y @hearsayhq/cli run suites/kitchen.yaml"
Enter
Wait+Screen@60s /runs failed/
Sleep 4s
