# Real run, uncut (rule 2): the flawed grocery add-on under Hearsay, red, exit 1.
#   HEARSAY_DIR=<a fresh clone> vhs tapes/household-flawed.tape
Source tapes/common.tape
Set FontSize 19
Output out/tapes/household-flawed.mp4
Hide
Type `cd "$HEARSAY_DIR" && export PS1='hearsay ($(git branch --show-current) @ $(git rev-parse --short HEAD)) $ ' && clear`
Enter
Show
Sleep 400ms
Type "date"
Enter
Sleep 500ms
Type "HEARSAY_FIXED=0 npm run server:orders > /tmp/hearsay-orders.log 2>&1 &   # the flawed build"
Enter
Sleep 1.5s
Type `npm run hearsay -- run suites/household-orders.yaml; echo "exit $?"`
Enter
Sleep 9s
Hide
Type "kill %1; clear"
Enter
