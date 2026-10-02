# Real run, one take: fresh clone → install → the Kitchen suite, green, exit 0. Film v4.
#   CLONE_PARENT=<an empty folder> vhs tapes/clone-4k.tape
Source tapes/common-4k.tape
Set FontSize 36
Output out/tapes/clone-4k.mp4
Hide
Type `cd "$CLONE_PARENT" && rm -rf hearsay && export PS1='\W $ ' && clear`
Enter
Show
Sleep 300ms
Type "date"
Enter
Sleep 400ms
Type "git clone -q https://github.com/hearsayhq/hearsay.git && cd hearsay"
Enter
Sleep 2.5s
Type "npm ci --no-audit --no-fund"
Enter
Sleep 4s
Type `npm run hearsay -- run suites/kitchen.yaml; echo "exit $?"`
Enter
Sleep 5s
