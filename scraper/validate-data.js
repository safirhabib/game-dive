const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const OPTIONAL_TEXT_FIELDS = ['description', 'fullDescription', 'availability'];

function isBlank(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function getValue(obj, pathSegments) {
  return pathSegments.reduce((value, key) => (value == null ? undefined : value[key]), obj);
}

function sampleLabel(record, index) {
  return record.title || record.url || `row ${index + 1}`;
}

function validatePrice(price) {
  const issues = [];
  const currentPrice = price?.currentInBdt ?? price?.current;
  const originalPrice = price?.originalInBdt ?? price?.original;
  const discount = price?.discount;

  if (!price || typeof price !== 'object') {
    issues.push({ severity: 'error', field: 'price', message: 'missing price object' });
    return issues;
  }

  if (typeof currentPrice !== 'number' || Number.isNaN(currentPrice) || currentPrice <= 0) {
    issues.push({ severity: 'error', field: 'price.current', message: 'must be a positive number' });
  }

  if (typeof originalPrice !== 'number' || Number.isNaN(originalPrice) || originalPrice <= 0) {
    issues.push({ severity: 'error', field: 'price.original', message: 'must be a positive number' });
  }

  if (
    typeof currentPrice === 'number' &&
    typeof originalPrice === 'number' &&
    originalPrice > 0 &&
    currentPrice > originalPrice
  ) {
    issues.push({ severity: 'warning', field: 'price', message: 'current price is higher than original price' });
  }

  if (discount !== undefined) {
    if (typeof discount !== 'number' || Number.isNaN(discount) || discount < 0 || discount > 100) {
      issues.push({ severity: 'warning', field: 'price.discount', message: 'discount should be between 0 and 100' });
    }
  }

  return issues;
}

function validateRecord(record, fileName, index) {
  const issues = [];
  const requiredFieldAccessors = [
    { field: 'title', value: record.title },
    { field: 'url', value: record.url || record.productUrl },
    { field: 'imageUrl', value: record.imageUrl }
  ];

  for (const requiredField of requiredFieldAccessors) {
    if (isBlank(requiredField.value)) {
      issues.push({ severity: 'error', field: requiredField.field, message: `${requiredField.field} is blank` });
    }
  }

  issues.push(...validatePrice(record.price));

  if (!Array.isArray(record.categories) || record.categories.length === 0) {
    issues.push({ severity: 'warning', field: 'categories', message: 'categories array is empty' });
  }

  for (const field of OPTIONAL_TEXT_FIELDS) {
    if (isBlank(record[field])) {
      issues.push({ severity: 'warning', field, message: `${field} is blank` });
    }
  }

  if (record.scrapedAt && Number.isNaN(Date.parse(record.scrapedAt))) {
    issues.push({ severity: 'warning', field: 'scrapedAt', message: 'invalid timestamp' });
  }

  const isSubscriptionFile = fileName.includes('subscription') || record.type === 'Subscription';
  if (isSubscriptionFile) {
    for (const field of ['duration', 'platform', 'region']) {
      const value = getValue(record, ['subscriptionDetails', field]);
      if (isBlank(value)) {
        issues.push({
          severity: 'warning',
          field: `subscriptionDetails.${field}`,
          message: `${field} is blank`
        });
      }
    }
  }

  return {
    label: sampleLabel(record, index),
    issues
  };
}

async function validateFile(filePath) {
  const fileName = path.basename(filePath);
  const raw = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    return {
      fileName,
      records: 0,
      parseError: null,
      issuesBySeverity: { error: 0, warning: 0 },
      fieldCounts: {},
      samples: [],
      skipped: true
    };
  }

  const fieldCounts = {};
  const samples = [];
  let errorCount = 0;
  let warningCount = 0;

  data.forEach((record, index) => {
    const result = validateRecord(record, fileName, index);

    result.issues.forEach(issue => {
      fieldCounts[issue.field] = (fieldCounts[issue.field] || 0) + 1;

      if (issue.severity === 'error') {
        errorCount += 1;
      } else {
        warningCount += 1;
      }
    });

    if (result.issues.length > 0 && samples.length < 5) {
      samples.push({
        label: result.label,
        issues: result.issues.map(issue => `${issue.severity}:${issue.field}:${issue.message}`)
      });
    }
  });

  return {
    fileName,
    records: data.length,
    parseError: null,
    issuesBySeverity: { error: errorCount, warning: warningCount },
    fieldCounts,
    samples,
    skipped: false
  };
}

async function main() {
  const fileNames = (await fs.readdir(DATA_DIR))
    .filter(fileName => fileName.endsWith('.json'))
    .sort();

  const reports = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const fileName of fileNames) {
    const filePath = path.join(DATA_DIR, fileName);

    try {
      const report = await validateFile(filePath);
      reports.push(report);
      totalErrors += report.issuesBySeverity.error;
      totalWarnings += report.issuesBySeverity.warning;
    } catch (error) {
      reports.push({
        fileName,
        records: 0,
        parseError: error.message,
        issuesBySeverity: { error: 1, warning: 0 },
        fieldCounts: {},
        samples: [],
        skipped: false
      });
      totalErrors += 1;
    }
  }

  for (const report of reports) {
    console.log(`\n${report.fileName}`);

    if (report.parseError) {
      console.log(`  parse error: ${report.parseError}`);
      continue;
    }

    if (report.skipped) {
      console.log('  skipped: file does not contain an array');
      continue;
    }

    console.log(`  records: ${report.records}`);
    console.log(`  errors: ${report.issuesBySeverity.error}`);
    console.log(`  warnings: ${report.issuesBySeverity.warning}`);

    const sortedFields = Object.entries(report.fieldCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (sortedFields.length > 0) {
      console.log(`  top fields: ${sortedFields.map(([field, count]) => `${field}=${count}`).join(', ')}`);
    }

    report.samples.forEach(sample => {
      console.log(`  sample: ${sample.label}`);
      console.log(`    ${sample.issues.join(' | ')}`);
    });
  }

  console.log(`\nValidation summary: ${reports.length} files, ${totalErrors} errors, ${totalWarnings} warnings`);

  if (totalErrors > 0) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error('Validation failed:', error.message);
  process.exit(1);
});
