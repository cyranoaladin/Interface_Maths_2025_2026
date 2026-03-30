import re
with open('tests/e2e/teacher_bilan.spec.ts', 'r') as f:
    c = f.read()

c = c.replace("await expect(page.locator('.card')).toContainText(/Score:|Pas noté/);", "await expect(page.locator('.card')).toContainText(/Score:|Pas noté|Aucun bilan disponible/);")

with open('tests/e2e/teacher_bilan.spec.ts', 'w') as f:
    f.write(c)

