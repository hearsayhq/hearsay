# Real run: an edited expectation in a locked suite turns the run red (suite.integrity).
#   HEARSAY_DIR=<a fresh clone> vhs tapes/agent-cheat.tape
Source tapes/common.tape
Output out/tapes/agent-cheat.mp4
Hide
Type `cd "$HEARSAY_DIR" && export PS1='hearsay ($(git branch --show-current) @ $(git rev-parse --short HEAD)) $ ' && clear`
Enter
Show
Sleep 400ms
Type `sed -i '' 's/minutes: 15, label: pasta/minutes: 50, label: pasta/' suites/kitchen.yaml   # "fix" the test instead of the add-on`
Enter
Sleep 600ms
Type `git diff -U0 suites/kitchen.yaml | grep '^[-+] '`
Enter
Sleep 1.2s
Type `npm run hearsay -- run suites/kitchen.yaml; echo "exit $?"`
Enter
Sleep 6s
Hide
Type "git checkout -q suites/kitchen.yaml; clear"
Enter
