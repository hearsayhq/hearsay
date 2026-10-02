# Real run: an edited expectation in a locked suite turns the run red (suite.integrity). Film v4.
#   HEARSAY_DIR=<a fresh clone> vhs tapes/cheat-4k.tape
Source tapes/common-4k.tape
Set FontSize 38
Output out/tapes/cheat-4k.mp4
Hide
Type `cd "$HEARSAY_DIR" && export PS1='hearsay $ ' && clear`
Enter
Show
Sleep 300ms
Type `sed -i '' 's/minutes: 15, label: pasta/minutes: 50, label: pasta/' suites/kitchen.yaml   # "fix" the test`
Enter
Sleep 400ms
Type `npm run hearsay -- run suites/kitchen.yaml; echo "exit $?"`
Enter
Sleep 5s
Hide
Type "git checkout -q suites/kitchen.yaml; clear"
Enter
