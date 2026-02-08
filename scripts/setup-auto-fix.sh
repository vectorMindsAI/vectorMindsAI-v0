#!/bin/bash
# ============================================================================
# setup-auto-fix.sh
# Sets up the required labels and configurations for the auto-fix workflow
# Run this once: bash scripts/setup-auto-fix.sh
# ============================================================================

set -e

REPO="${1:-vectorMindsAI/vectorMindsAI-v0}"

echo "🔧 Setting up auto-fix labels for $REPO"
echo "============================================"

# Create labels (ignore errors if they already exist)
create_label() {
    local name="$1"
    local color="$2"
    local desc="$3"
    gh label create "$name" --repo "$REPO" --color "$color" --description "$desc" 2>/dev/null && \
        echo "  ✅ Created label: $name" || \
        echo "  ⏭️  Label exists: $name"
}

create_label "auto-fix"       "0E8A16" "Automatically fixed by auto-fix workflow"
create_label "automated"      "1D76DB" "Created by automated processes"
create_label "security"       "B60205" "Security-related issue or fix"
create_label "code-quality"   "FBCA04" "Code quality improvement"
create_label "maintenance"    "D4C5F9" "General maintenance task"
create_label "error-handling" "FF6600" "Error handling improvement"
create_label "typescript"     "3178C6" "TypeScript-related"
create_label "dependencies"   "0366D6" "Dependency update"

echo ""
echo "✅ Label setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Push the workflow files to your repo"
echo "  2. The workflow will run automatically on Mon/Wed/Fri"
echo "  3. You can also trigger it manually from Actions tab"
echo "  4. Review and merge the PRs when you're free"
echo ""
echo "🔗 Manual trigger: https://github.com/$REPO/actions/workflows/auto-fix.yml"
