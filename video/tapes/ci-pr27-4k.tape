# Real CI (rule 3): pull request #27's hearsay / voice check, red on the change, green after the
# fix, read from GitHub with gh. Film v4.
#   HEARSAY_DIR=<a fresh clone> vhs tapes/ci-pr27-4k.tape
Source tapes/common-4k.tape
Set FontSize 38
Output out/tapes/ci-pr27-4k.mp4
Hide
Type `cd "$HEARSAY_DIR" && export PS1='hearsay $ ' GH_NO_UPDATE_NOTIFIER=1 GH_SPINNER_DISABLED=1 && clear`
Enter
Show
Sleep 300ms
Type "gh run view 36779993236   # pull request #27: check the budget for counted items only"
Enter
Sleep 3.5s
Type "gh run view 36779993236 --log-failed | grep -o 'consent.misheard_amount.*'"
Enter
Sleep 3s
Type "gh run view 36780493038   # pull request #27, after the fix"
Enter
Sleep 4s
