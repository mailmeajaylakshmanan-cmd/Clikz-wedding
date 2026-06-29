const fs = require('fs');
const file = 'c:\\\\Our-project\\\\clikz-wedding-bills\\\\clikz-wedding-billing\\\\client\\\\src\\\\components\\\\InvoiceForm.jsx';
let content = fs.readFileSync(file, 'utf8');

const broken = `  function toggleAdvance2(checked) {
    setForm(function (f) {
      return { ...f, showAdvance2: checked, advancePaid2: checked ? f.advancePaid2 : 0 };
    });
  }

  function toggleAdvance3(checked) {
    setForm(function (f) {
      return { ...f, showAdvance3: checked, advancePaid3: checked ? f.advancePaid3 : 0 };
    });
  };

  return (`

const fixed = `  function toggleAdvance2(checked) {
    setForm(function (f) {
      return { ...f, showAdvance2: checked, advancePaid2: checked ? f.advancePaid2 : 0 };
    });
  }

  function toggleAdvance3(checked) {
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

  return (`

if (content.includes(broken)) {
  fs.writeFileSync(file, content.replace(broken, fixed));
  console.log('Fixed successfully');
} else {
  console.log('Broken string not found!');
}
