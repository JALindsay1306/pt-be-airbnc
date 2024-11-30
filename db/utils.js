exports.createUserRef = (users) => {
  let treatedUsers = {};
  users.forEach((user)=>{
    const userFullName = `${user.first_name} ${user.surname}`;
    treatedUsers[userFullName] = user.user_id;
  })
  return treatedUsers;

}

exports.createRef = (key,value,data) => {
  return data.reduce((refObj, row) => {
    refObj[row[key]] = row[value];
    return refObj;
  }, {});
};

exports.formatData = (refObjs, keysToRemove, keysToAdd, rawData) => {
  if(!Array.isArray(refObjs)){refObjs = [refObjs]};
  if(!Array.isArray(keysToRemove)){keysToRemove = [keysToRemove]};
  if(!Array.isArray(keysToAdd)){keysToAdd = [keysToAdd]};
  let formattedData = [...rawData];
  for(let i = 0; i<refObjs.length;i++){
    formattedData = formattedData.map(row=>{
      const { [keysToRemove[i]]: removedKey, ...rest } = row;
      const newValue = refObjs[i][removedKey];
      return { ...rest, [keysToAdd[i]]: newValue };
    });
  };
  return formattedData;
};
 