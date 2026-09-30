# Real run, one take: fresh clone → install → the Kitchen suite, green, exit 0.
#   CLONE_PARENT=<an empty folder> vhs tapes/fresh-clone.tape
Source tapes/common.tape
Output out/tapes/fresh-clone.mp4
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
Sleep 3.5s
Type `npm run hearsay -- run suites/kitchen.yaml; echo "exit $?"`
Enter
Sleep 5s
