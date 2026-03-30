import re
with open('tests/e2e/teacher_bilan.spec.ts', 'r') as f:
    c = f.read()

c = c.replace("page.locator('#back-to-students')", "page.locator('#back-to-group')")

with open('tests/e2e/teacher_bilan.spec.ts', 'w') as f:
    f.write(c)

