#!/usr/bin/env node

import fs from 'fs/promises';
import { SWAGGER_DESCRIPTION } from '../config/general';

const generateFile = async () => {
  // const configFile = await import("../config/general.ts");
  const jsonData = JSON.stringify(SWAGGER_DESCRIPTION, null, 2);
  fs.writeFile('next-swagger-doc.json', jsonData).then(() => {
    console.log('JSON saved');
  });
};
generateFile();
