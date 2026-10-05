# Real run, one take: fresh clone → install → the Kitchen suite, green, exit 0. Film v5.
# Waits for each prompt instead of sleeping, so nothing is typed into running output; npm's
# warnings are hidden (--loglevel=error), errors would still show.
#   CLONE_PARENT=<an empty folder named fresh> vhs tapes/clone-v5.tape
Source tapes/common-4k.tape
Set FontSize 36
Output out/tapes/clone-v5.mp4
Hide
Type `cd "$CLONE_PARENT" && rm -rf hearsay && export PS1='\W $ ' && clear`
Enter
Wait /fresh \$$/
Show
Sleep 300ms
Type "date"
Enter
Sleep 400ms
Type "git clone -q https://github.com/hearsayhq/hearsay.git && cd hearsay"
Enter
Wait@60s /hearsay \$$/
Sleep 300ms
Type "npm ci --no-audit --no-fund --loglevel=error"
Enter
Wait@180s /hearsay \$$/
Sleep 300ms
Type `npm run hearsay -- run suites/kitchen.yaml; echo "exit $?"`
Enter
Wait+Screen@60s /exit 0/
Sleep 4s
