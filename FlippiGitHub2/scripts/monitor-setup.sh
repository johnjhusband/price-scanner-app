#!/bin/bash
# Helper script to monitor server setup workflows

echo "🔍 Monitoring Flippi.ai Server Setup Workflows"
echo "=============================================="

# Function to show workflow status
show_workflow_status() {
    local workflow_name=$1
    local run_info=$(gh run list --workflow="$workflow_name" --limit 1 --json status,conclusion,databaseId,headBranch,createdAt 2>/dev/null)
    
    if [ -z "$run_info" ] || [ "$run_info" = "[]" ]; then
        echo "No recent runs found for $workflow_name"
        return
    fi
    
    local status=$(echo "$run_info" | jq -r '.[0].status')
    local conclusion=$(echo "$run_info" | jq -r '.[0].conclusion // "pending"')
    local run_id=$(echo "$run_info" | jq -r '.[0].databaseId')
    local created=$(echo "$run_info" | jq -r '.[0].createdAt')
    
    echo ""
    echo "📋 $workflow_name"
    echo "   Status: $status"
    echo "   Result: $conclusion"
    echo "   Run ID: $run_id"
    echo "   Started: $created"
    
    if [ "$status" = "in_progress" ]; then
        echo ""
        echo "   ⏳ Workflow is running. View details:"
        echo "   gh run view $run_id"
        echo "   gh run watch $run_id"
    elif [ "$conclusion" = "success" ]; then
        echo ""
        echo "   ✅ Workflow completed successfully!"
        echo "   View summary: gh run view $run_id"
    elif [ "$conclusion" = "failure" ]; then
        echo ""
        echo "   ❌ Workflow failed!"
        echo "   View logs: gh run view $run_id --log-failed"
    fi
}

# Check both workflows
show_workflow_status "setup-new-server.yml"
show_workflow_status "setup-ssl-certificate.yml"

echo ""
echo "=============================================="
echo "Quick Commands:"
echo ""
echo "1. Start new server setup:"
echo "   gh workflow run setup-new-server.yml \\"
echo "     -f target_server_ip=\"YOUR_IP\" \\"
echo "     -f environment=\"blue\" \\"
echo "     -f root_password=\"YOUR_PASSWORD\""
echo ""
echo "2. Setup SSL (after DNS update):"
echo "   gh workflow run setup-ssl-certificate.yml \\"
echo "     -f environment=\"blue\" \\"
echo "     -f email=\"admin@flippi.ai\""
echo ""
echo "3. Watch running workflow:"
echo "   gh run watch"
echo ""
echo "4. View workflow summary:"
echo "   gh run view --web"