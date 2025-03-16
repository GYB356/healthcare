import { A11yAuditSystem } from './a11yAuditSystem';
import { A11ySeverity } from './types';
import { A11yViolation, AuditResult } from '../../../types';

export {
  A11yAuditSystem,
  A11ySeverity
};

interface AuditOptions {
  baseUrl: string;
  routes: string[];
  outputDir: string;
  headless?: boolean;
  failOnCritical?: boolean;
  maxDepth?: number;
}

interface ComplianceReportSummary {
  total: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  passRate: number;
  importantViolations: Array<{ 
    id: string;
    impact: string;
    help: string;
    helpUrl: string;
    nodeCount: number;
  }>;
}

// Export a convenient function to run the audit
export const runA11yAudit = async (options: AuditOptions): Promise<AuditResult[]> => {
  const auditSystem = new A11yAuditSystem({
    baseUrl: options.baseUrl,
    routes: options.routes,
    outputDir: options.outputDir,
    headless: options.headless !== false,
    failOnCritical: options.failOnCritical || false,
    maxDepth: options.maxDepth || 3
  });
  
  await auditSystem.run();
  return await auditSystem.generateReport();
};

// Create a function to generate a compliance report
export const generateA11yComplianceReport = async (auditResults: AuditResult[]): Promise<string> => {
  const summary = createComplianceReport(auditResults);
  return summary;
};

function createComplianceReport(auditResults: AuditResult[]): string {
  // Initialize summary text
  let summary = `# Accessibility Compliance Report\n`;
  summary += `Generated: ${new Date().toISOString()}\n\n`;
  summary += `## Summary\n`;
  
  // Flatten all violations across routes
  const allViolations: A11yViolation[] = [];
  auditResults.forEach(result => {
    if (result.results.violations) {
      allViolations.push(...result.results.violations);
    }
  });
  
  // Add overall stats
  summary += `Total violations: ${allViolations.length}\n`;
  
  // Count violations by impact
  const impactCounts: Record<string, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0
  };
  
  allViolations.forEach((v) => {
    if (impactCounts[v.impact]) {
      impactCounts[v.impact]++;
    }
  });
  
  summary += `Critical: ${impactCounts.critical}\n`;
  summary += `Serious: ${impactCounts.serious}\n`;
  summary += `Moderate: ${impactCounts.moderate}\n`;
  summary += `Minor: ${impactCounts.minor}\n\n`;
  
  // Add details for critical and serious violations
  const importantViolations = allViolations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  
  if (importantViolations.length > 0) {
    summary += 'Important violations:\n';
    
    importantViolations.forEach((violation) => {
      summary += `- [${violation.impact.toUpperCase()}] ${violation.help} (${violation.id})\n`;
      summary += `  Help: ${violation.helpUrl}\n`;
      
      // Add affected elements
      if (violation.nodes.length > 0) {
        summary += '  Affected elements:\n';
        violation.nodes.slice(0, 3).forEach((node) => {
          summary += `  - ${node.html.substring(0, 100)}${node.html.length > 100 ? '...' : ''}\n`;
        });
        
        if (violation.nodes.length > 3) {
          summary += `  - And ${violation.nodes.length - 3} more elements\n`;
        }
      }
      
      summary += '\n';
    });
  }
  
  return summary;
}

// Export a function to get a summarized compliance report in object form
export const getComplianceSummary = (auditResults: AuditResult[]): ComplianceReportSummary => {
  // Flatten all violations across routes
  const allViolations: A11yViolation[] = [];
  auditResults.forEach(result => {
    if (result.results.violations) {
      allViolations.push(...result.results.violations);
    }
  });
  
  // Count violations by impact
  const impactCounts: Record<string, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0
  };
  
  allViolations.forEach((v) => {
    if (impactCounts[v.impact]) {
      impactCounts[v.impact]++;
    }
  });
  
  // Get important violations
  const importantViolations = allViolations
    .filter(v => v.impact === 'critical' || v.impact === 'serious')
    .map(v => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      helpUrl: v.helpUrl,
      nodeCount: v.nodes.length
    }));
  
  // Calculate a simple pass rate (lower is worse)
  const totalIssues = impactCounts.critical * 10 + impactCounts.serious * 3 + 
                      impactCounts.moderate + impactCounts.minor * 0.5;
  const passRate = Math.max(0, Math.min(100, 100 - totalIssues));
  
  return {
    total: allViolations.length,
    critical: impactCounts.critical,
    serious: impactCounts.serious,
    moderate: impactCounts.moderate,
    minor: impactCounts.minor,
    passRate: Math.round(passRate),
    importantViolations
  };
};