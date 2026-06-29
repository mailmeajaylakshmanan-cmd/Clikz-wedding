const fs = require('fs');
const file = 'c:\\\\Our-project\\\\clikz-wedding-bills\\\\clikz-wedding-billing\\\\client\\\\src\\\\components\\\\InvoiceForm.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /function toggleAdvance3\(checked\) \{\s*setForm\(function \(f\) \{\s*return \{ \.\.\.f, showAdvance3: checked, advancePaid3: checked \? f\.advancePaid3 : 0 \};\s*\}\);\s*\};\s*return \(/;

const fixed = `function toggleAdvance3(checked) {
    setForm(function (f) {
      return { ...f, showAdvance3: checked, advancePaid3: checked ? f.advancePaid3 : 0 };
    });
  }

  function toggleFinal(checked) {
    setForm(function (f) {
      return { ...f, showFinal: checked, totalPaid: checked ? f.totalPaid : 0 };
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const category = eventCategories.find(function (c) { return c._id === form.eventCategory; });
    onSubmit({
      ...form,
      subTotal,
      total,
      balance,
      eventCategory: form.eventCategory,
      eventCategoryName: category?.name || form.event,
      showTerms: category?.showTerms ?? true,
      termsAndConditions: category?.showTerms ? (category?.termsAndConditions || '') : '',
    });
  }

  const getDescriptions = function (serviceName) {
    const found = serviceOptions.find(function (s) { return s.name === serviceName; });
    return found ? found.descriptions : [];
  };

  return (`;

if (regex.test(content)) {
  fs.writeFileSync(file, content.replace(regex, fixed));
  console.log('Fixed successfully');
} else {
  console.log('Regex did not match!');
}
