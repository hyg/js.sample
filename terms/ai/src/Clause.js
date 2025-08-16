/**
 * Represents a smart clause which can be either a text clause or a composite of sub-clauses.
 * A global registry 'globalClauseRegistry' must be defined to resolve sub-clause IDs.
 */
class Clause {
  /**
   * Creates a new Clause instance.
   * @param {Object} data - The data for the clause.
   * @param {string} [data.text] - The main text content of the clause (for text clauses).
   * @param {string} data.name - The name of the clause.
   * @param {string} [data.readme] - Additional notes or description for the clause.
   * @param {string} [data.revisionProcessId] - The ID of the clause defining the revision process.
   * @param {Array<Object>} [data.subClauses] - An array of sub-clause definitions (for composite clauses).
   *    Each object in the array should have:
   *    - {string} id: The ID of the sub-clause.
   *    - {number} index: The order number of the sub-clause within this composite clause.
   *    - {Object} [mapping]: A mapping from placeholders to real values specific to this sub-clause's inclusion.
   *    - {string} [numberPrefix]: A prefix to be added to the sub-clause's internal numbering.
   * @param {Object} [data.parentMapping] - A mapping from placeholders to real values inherited from parent.
   * @param {Object} [data.localMapping] - A local mapping from placeholders to real values for this clause.
   */
  constructor(data) {
    if (!data.name) {
      throw new Error("Clause name is required.");
    }
    this.name = data.name;
    this.readme = data.readme || "";
    // Requirement: "修订程序，由一个条款的id表示。"
    this.revisionProcessId = data.revisionProcessId || null;

    // For text clauses
    if (data.text !== undefined) {
      this.text = data.text;
      // Requirement: ID is the first 8 characters of the SHA256 hash of the text.
      this.id = this._generateId(this.text);
      // Local mapping for this text clause
      this.localMapping = data.localMapping || {};
      this.subClauses = []; // Text clauses don't have sub-clauses directly
    } else if (data.subClauses !== undefined) {
      // For composite clauses
      this.text = null; // Composite clauses don't have direct text
      // Process sub-clauses according to the detailed spec
      this.subClauses = (data.subClauses || []).map(scData => ({
          id: scData.id,
          index: scData.index,
          mapping: scData.mapping || {}, // Mapping that overrides sub-clause's own mapping when used in this context
          numberPrefix: scData.numberPrefix || ""
      }));
      // The ID for a composite clause is generated based on its sub-clause IDs only.
      // This makes the composite ID more stable, changing only if a sub-clause ID changes.
      // The original structure-based ID is commented out below for reference.
      // this.id = data.id || this._generateCompositeId(this.subClauses); // Original structure-based ID
      this.id = data.id || this._generateCompositeIdFromSubClauseIds(this.subClauses.map(sc => sc.id)); // New ID based on sub-clause IDs
      this.localMapping = data.localMapping || {};
    } else {
      throw new Error("Clause must have either 'text' or 'subClauses' defined.");
    }

    // Mapping inherited from parent or context
    this.parentMapping = data.parentMapping || {};
    
    // Register this clause in the global registry if it's defined
    if (typeof globalClauseRegistry !== 'undefined') {
        globalClauseRegistry[this.id] = this;
    }
  }

  /**
   * Generates an ID based on the hash of the text content.
   * @param {string} text - The text to hash.
   * @returns {string} The generated ID (first 8 characters of the hash).
   * @private
   */
  _generateId(text) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(text);
    return hash.digest('hex').substring(0, 8);
  }

  /** 
   * Generates an ID for a composite clause based on the IDs of its sub-clauses.
   * This makes the composite ID more stable, as it only changes if a sub-clause ID changes,
   * not if the structure (index, mapping, prefix) of a sub-clause definition changes.
   * @param {Array<string>} subClauseIds - The IDs of the sub-clauses.
   * @returns {string} The generated ID.
   * @private
   */
  _generateCompositeIdFromSubClauseIds(subClauseIds) {
    // Sort the IDs to ensure order doesn't affect the hash if order is not significant to identity
    // If the order of sub-clauses is part of the identity, remove the sort.
    const sortedIds = [...subClauseIds].sort();
    const idsStr = JSON.stringify(sortedIds);
    return this._generateId(idsStr);
  }
  
  /**
   * Generates an ID for a composite clause based on its sub-clause structure.
   * @param {Array<Object>} subClauses - The sub-clause definitions.
   * @returns {string} The generated ID.
   * @private
   */
  _generateCompositeId(subClauses) {
    // Hash of the sorted and serialized sub-clause structure
    const subClausesStr = JSON.stringify(subClauses);
    return this._generateId(subClausesStr);
  }

  /**
   * Gets the effective mapping for this clause, combining parent and local mappings.
   * Local mappings override parent mappings.
   * @returns {Object} The combined mapping.
   */
  getEffectiveMapping() {
    return { ...this.parentMapping, ...this.localMapping };
  }

  /**
   * Applies anonymization mappings to the text.
   * @param {string} content - The content to anonymize.
   * @param {Object} mapping - The mapping of placeholders to real values.
   * @returns {string} The anonymized content.
   */
  _applyAnonymization(content, mapping) {
    let anonymizedContent = content;
    for (const [placeholder, realValue] of Object.entries(mapping)) {
      // Use a global regex to replace all occurrences
      // Escape special regex characters in realValue
      const escapedRealValue = realValue.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
      const regex = new RegExp(escapedRealValue, 'g');
      anonymizedContent = anonymizedContent.replace(regex, placeholder);
    }
    return anonymizedContent;
  }

  /**
   * Generates the content of the clause, applying anonymization.
   * @param {Object} [overrideParentMapping] - An optional mapping to override the parent mapping for this generation cycle.
   * @returns {Object} An object containing the original and anonymized text.
   */
  generateContent(overrideParentMapping = null) {
    // Use override mapping if provided, otherwise use the instance's parent mapping
    const effectiveParentMapping = overrideParentMapping !== null ? overrideParentMapping : this.parentMapping;
    const effectiveMapping = { ...effectiveParentMapping, ...this.localMapping };

    if (this.text !== null) {
      // Text clause
      const originalText = this.text;
      const anonymizedText = this._applyAnonymization(originalText, effectiveMapping);
      return {
        original: originalText,
        anonymized: anonymizedText,
        id: this.id,
        name: this.name,
        readme: this.readme
      };
    } else {
      // Composite clause
      let originalContentParts = [];
      let anonymizedContentParts = [];
      
      // Sort sub-clauses by their index to ensure correct order
      const sortedSubClauses = [...this.subClauses].sort((a, b) => {
        // Handle potentially complex indices (strings)
        if (typeof a.index === 'string' && typeof b.index === 'string') {
            // Simple string comparison for now. Could be improved with natural sort if needed.
            return a.index.localeCompare(b.index); 
        }
        // Default numeric comparison
        return a.index - b.index;
      });

      sortedSubClauses.forEach((subClauseDef) => {
        // Resolve sub-clause from the global registry
        if (typeof globalClauseRegistry === 'undefined') {
            throw new Error('Global clause registry (globalClauseRegistry) is required for composite clauses.');
        }
        const subClause = globalClauseRegistry[subClauseDef.id];
        if (!subClause) {
            throw new Error(`Sub-clause with ID '${subClauseDef.id}' not found in global registry.`);
        }

        // Create effective mapping for the sub-clause in this context:
        // 1. Parent's effective mapping
        // 2. Sub-clause's own local mapping
        // 3. Mapping overrides specific to this inclusion (subClauseDef.mapping)
        const contextMappingForSubClause = { 
            ...effectiveMapping, 
            ...subClause.localMapping, 
            ...subClauseDef.mapping 
        };
        
        // Pass the context mapping directly to generateContent to avoid mutating subClause
        const subContent = subClause.generateContent(contextMappingForSubClause);

        // Apply number prefix from sub-clause definition to each line of the sub-clause content
        const prefix = subClauseDef.numberPrefix;
        const prefixedOriginalLines = subContent.original
            .split('\n')
            .map(line => line ? `${prefix} ${line}` : line); // Don't prefix empty lines
        const prefixedOriginal = prefixedOriginalLines.join('\n');
            
        const prefixedAnonymizedLines = subContent.anonymized
            .split('\n')
            .map(line => line ? `${prefix} ${line}` : line); // Don't prefix empty lines
        const prefixedAnonymized = prefixedAnonymizedLines.join('\n');

        // Add the prefixed content as a part
        originalContentParts.push(prefixedOriginal);
        anonymizedContentParts.push(prefixedAnonymized);
      });

      // Join parts with double newlines for Markdown paragraph breaks
      const originalContent = originalContentParts.join('\n\n');
      const anonymizedContent = anonymizedContentParts.join('\n\n');

      return {
        original: originalContent,
        anonymized: anonymizedContent,
        id: this.id,
        name: this.name,
        readme: this.readme
      };
    }
  }

  /**
   * Generates Markdown representation of the clause.
   * @returns {string} The Markdown content.
   */
  toMarkdown() {
    const content = this.generateContent();
    let md = `# ${content.name}\n\n`;
    md += `**ID:** ${content.id}\n\n`;
    if (content.readme) {
      md += `**Readme:** ${content.readme}\n\n`;
    }
    if (this.revisionProcessId) {
        md += `**Revision Process ID:** ${this.revisionProcessId}\n\n`;
    }
    md += `## Original Text\n\n${content.original}\n\n`;
    md += `## Anonymized Text\n\n${content.anonymized}\n\n`;
    return md;
  }

  /**
   * Generates HTML representation of the clause.
   * @returns {string} The HTML content.
   */
  toHtml() {
    const content = this.generateContent();
    let html = `<!DOCTYPE html>
<html>
<head>
    <title>${content.name}</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1, h2 { color: #333; }
        pre { background-color: #f4f4f4; padding: 10px; border-radius: 5px; white-space: pre-wrap; } /* pre-wrap to handle newlines */
        .number-prefix { font-weight: bold; } /* Style for number prefixes */
    </style>
</head>
<body>
    <h1>${content.name}</h1>
    <p><strong>ID:</strong> ${content.id}</p>`;
    if (content.readme) {
      html += `\n    <p><strong>Readme:</strong> ${content.readme}</p>`;
    }
    if (this.revisionProcessId) {
        html += `\n    <p><strong>Revision Process ID:</strong> ${this.revisionProcessId}</p>`;
    }
    
    // Function to wrap number prefixes in HTML <span> tags for styling
    // This regex is more robust: it captures any non-whitespace characters at the start of a line as the prefix
    // and ensures there's content following it (after optional whitespace) before applying the span.
    // It handles prefixes like "1.2.3", "A.", "①", "一、" etc., without requiring a trailing space in the prefix definition.
    const wrapNumberPrefixes = (text) => {
        return text.replace(/^(\S+\s*)(.*?)($)/gm, (match, prefix, rest, newline) => {
            // Only wrap if there's actual content after the prefix
            if (rest.trim() !== '') {
                return `<span class="number-prefix">${prefix}</span>${rest}${newline}`;
            }
            // If the line is just a prefix (or empty after prefix), return as is
            return match;
        });
    };
    
    html += `
    <h2>Original Text</h2>
    <pre>${wrapNumberPrefixes(content.original.replace(/\n/g, '<br>'))}</pre>
    <h2>Anonymized Text</h2>
    <pre>${wrapNumberPrefixes(content.anonymized.replace(/\n/g, '<br>'))}</pre>
</body>
</html>`;
    return html;
  }
}

module.exports = Clause;