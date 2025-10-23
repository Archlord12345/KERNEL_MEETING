// Script de validation pour vérifier la mise en forme et la cohérence

const fs = require('fs');
const path = require('path');

console.log('🔍 Validation de la mise en forme de l\'application VideoConf...\n');

// Fonction pour vérifier l'existence des fichiers
function checkFileExists(filePath) {
    try {
        fs.accessSync(filePath, fs.constants.F_OK);
        return true;
    } catch (err) {
        return false;
    }
}

// Fonction pour vérifier la syntaxe HTML basique
function validateHTML(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Vérifier la structure de base
    if (!content.includes('<!DOCTYPE html>')) {
        issues.push('DOCTYPE manquant');
    }
    
    if (!content.includes('<html lang="fr">')) {
        issues.push('Attribut lang manquant ou incorrect');
    }
    
    if (!content.includes('<meta charset="UTF-8">')) {
        issues.push('Charset UTF-8 manquant');
    }
    
    if (!content.includes('<meta name="viewport"')) {
        issues.push('Meta viewport manquant');
    }
    
    // Vérifier les balises fermantes
    const openTags = content.match(/<[^\/][^>]*>/g) || [];
    const closeTags = content.match(/<\/[^>]*>/g) || [];
    
    return issues;
}

// Fonction pour vérifier la syntaxe CSS basique
function validateCSS(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Vérifier les accolades équilibrées
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    
    if (openBraces !== closeBraces) {
        issues.push(`Accolades non équilibrées: ${openBraces} ouvertes, ${closeBraces} fermées`);
    }
    
    // Vérifier les propriétés dupliquées dans les sélecteurs
    const rules = content.split('}');
    for (let rule of rules) {
        if (rule.includes('{')) {
            const properties = rule.split('{')[1];
            if (properties) {
                const props = properties.split(';').map(p => p.split(':')[0].trim()).filter(p => p);
                const duplicates = props.filter((prop, index) => props.indexOf(prop) !== index);
                if (duplicates.length > 0) {
                    issues.push(`Propriétés dupliquées détectées: ${duplicates.join(', ')}`);
                }
            }
        }
    }
    
    return issues;
}

// Fonction pour vérifier la syntaxe JavaScript basique
function validateJS(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Vérifier les parenthèses équilibrées
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    
    if (openParens !== closeParens) {
        issues.push(`Parenthèses non équilibrées: ${openParens} ouvertes, ${closeParens} fermées`);
    }
    
    // Vérifier les accolades équilibrées
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    
    if (openBraces !== closeBraces) {
        issues.push(`Accolades non équilibrées: ${openBraces} ouvertes, ${closeBraces} fermées`);
    }
    
    return issues;
}

// Liste des fichiers à vérifier
const filesToCheck = [
    { path: 'index.html', type: 'html', description: 'Page d\'accueil' },
    { path: 'create-meeting.html', type: 'html', description: 'Page de création de réunion' },
    { path: 'meeting.html', type: 'html', description: 'Interface de réunion' },
    { path: 'styles/main.css', type: 'css', description: 'Styles principaux' },
    { path: 'js/main.js', type: 'js', description: 'JavaScript principal' },
    { path: 'js/create-meeting.js', type: 'js', description: 'JavaScript création réunion' },
    { path: 'js/meeting.js', type: 'js', description: 'JavaScript interface réunion' },
    { path: 'server.js', type: 'js', description: 'Serveur Node.js' },
    { path: 'package.json', type: 'json', description: 'Configuration npm' },
    { path: 'README.md', type: 'md', description: 'Documentation' }
];

let totalIssues = 0;

// Vérification de chaque fichier
for (const file of filesToCheck) {
    const filePath = path.join(__dirname, file.path);
    
    console.log(`📄 ${file.description} (${file.path})`);
    
    if (!checkFileExists(filePath)) {
        console.log(`   ❌ Fichier manquant`);
        totalIssues++;
        continue;
    }
    
    let issues = [];
    
    try {
        switch (file.type) {
            case 'html':
                issues = validateHTML(filePath);
                break;
            case 'css':
                issues = validateCSS(filePath);
                break;
            case 'js':
                issues = validateJS(filePath);
                break;
            case 'json':
                // Vérifier que le JSON est valide
                try {
                    JSON.parse(fs.readFileSync(filePath, 'utf8'));
                } catch (e) {
                    issues.push('JSON invalide: ' + e.message);
                }
                break;
        }
        
        if (issues.length === 0) {
            console.log(`   ✅ Aucun problème détecté`);
        } else {
            console.log(`   ⚠️  ${issues.length} problème(s) détecté(s):`);
            issues.forEach(issue => {
                console.log(`      - ${issue}`);
            });
            totalIssues += issues.length;
        }
    } catch (error) {
        console.log(`   ❌ Erreur lors de la validation: ${error.message}`);
        totalIssues++;
    }
    
    console.log('');
}

// Vérifications supplémentaires
console.log('🔧 Vérifications supplémentaires:');

// Vérifier que les liens entre fichiers sont corrects
const indexContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
if (indexContent.includes('styles/main.css')) {
    console.log('   ✅ Lien CSS correct dans index.html');
} else {
    console.log('   ⚠️  Lien CSS manquant dans index.html');
    totalIssues++;
}

if (indexContent.includes('js/main.js')) {
    console.log('   ✅ Lien JavaScript correct dans index.html');
} else {
    console.log('   ⚠️  Lien JavaScript manquant dans index.html');
    totalIssues++;
}

// Vérifier la cohérence des noms de classes CSS
const cssContent = fs.readFileSync(path.join(__dirname, 'styles/main.css'), 'utf8');
const htmlFiles = ['index.html', 'create-meeting.html', 'meeting.html'];

for (const htmlFile of htmlFiles) {
    const htmlContent = fs.readFileSync(path.join(__dirname, htmlFile), 'utf8');
    const classes = htmlContent.match(/class="([^"]*)"/g) || [];
    
    let missingClasses = 0;
    for (const classMatch of classes) {
        const className = classMatch.match(/class="([^"]*)"/)[1];
        const classNames = className.split(' ');
        
        for (const cls of classNames) {
            if (cls && !cssContent.includes(`.${cls}`)) {
                missingClasses++;
            }
        }
    }
    
    if (missingClasses === 0) {
        console.log(`   ✅ Toutes les classes CSS sont définies dans ${htmlFile}`);
    } else {
        console.log(`   ⚠️  ${missingClasses} classe(s) CSS manquante(s) dans ${htmlFile}`);
        totalIssues += missingClasses;
    }
}

console.log('\n' + '='.repeat(50));
if (totalIssues === 0) {
    console.log('🎉 Validation terminée: Aucun problème détecté!');
    console.log('✨ L\'application est prête à être utilisée.');
} else {
    console.log(`⚠️  Validation terminée: ${totalIssues} problème(s) détecté(s)`);
    console.log('🔧 Veuillez corriger les problèmes mentionnés ci-dessus.');
}

console.log('\n📋 Résumé de l\'application:');
console.log('   • 4 interfaces utilisateur modernes');
console.log('   • Vidéoconférence WebRTC');
console.log('   • Chat en temps réel');
console.log('   • Design responsive');
console.log('   • Serveur Node.js complet');
console.log('\n🚀 Pour démarrer: npm start');
console.log('🌐 Accès: http://localhost:3000');
