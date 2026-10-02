# Real run, uncut (rule 2): the flawed grocery add-on under Hearsay, red, exit 1. Film v4.
#   HEARSAY_DIR=<a fresh clone> vhs tapes/orders-flawed-4k.tape
Source tapes/common-4k.tape
Output out/tapes/orders-flawed-4k.mp4
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
Sleep 1.2s
Type `npm run hearsay -- run suites/household-orders.yaml; echo "exit $?"`
Enter
Sleep 11s
Hide
Type "kill %1; clear"
Enter
