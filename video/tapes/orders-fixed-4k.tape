# Real run, uncut: the fixed grocery add-on, same suite, green, exit 0. Film v4.
#   HEARSAY_DIR=<a fresh clone> vhs tapes/orders-fixed-4k.tape
Source tapes/common-4k.tape
Output out/tapes/orders-fixed-4k.mp4
Hide
Type `cd "$HEARSAY_DIR" && export PS1='hearsay ($(git branch --show-current) @ $(git rev-parse --short HEAD)) $ ' && clear`
Enter
Show
Sleep 300ms
Type "HEARSAY_FIXED=1 npm run server:orders > /tmp/hearsay-orders.log 2>&1 &   # the fixed build"
Enter
Sleep 1.2s
Type `npm run hearsay -- run suites/household-orders.yaml; echo "exit $?"`
Enter
Sleep 8s
Hide
Type "kill %1; clear"
Enter
