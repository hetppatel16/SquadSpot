export const calculatePerPerson = (totalBudget, people) => {
  if (people <= 0) return 0;
  return Math.round(totalBudget / people);
};

export const calculateTotal = (perPerson, people) => {
  return perPerson * people;
};
