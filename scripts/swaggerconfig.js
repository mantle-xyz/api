#!/usr/bin/env node

import fs from 'fs/promises';
import * as configFile from '../config/general.ts';

const generateFile = async () => {
  // const configFile = await import("../config/general.ts");
  const jsonData = JSON.stringify(configFile.SWAGGER_DESCRIPTION, false, 2);
  fs.writeFile('next-swagger-doc.json', jsonData).then(() => {
    console.log('JSON saved');
  });
};
generateFile();
