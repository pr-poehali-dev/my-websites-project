import json
import os
import psycopg2
from datetime import datetime, timedelta
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage user subscriptions (create, update, list)
    Args: event with httpMethod, body
    Returns: subscription data or list of users with subscriptions
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    if method == 'GET':
        cur.execute("""
            SELECT DISTINCT ON (u.id) u.id, u.email, u.name, u.is_admin, s.is_active, s.expires_at
            FROM users u
            LEFT JOIN subscriptions s ON u.id = s.user_id
            ORDER BY u.id, s.created_at DESC
        """)
        users = cur.fetchall()
        
        result = []
        for user in users:
            result.append({
                'id': user[0],
                'email': user[1],
                'name': user[2],
                'is_admin': user[3],
                'subscription': {
                    'is_active': user[4] if user[4] is not None else False,
                    'expires_at': user[5].isoformat() if user[5] else None
                }
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps(result),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('user_id')
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'user_id is required'}),
                'isBase64Encoded': False
            }
        
        expires_at = datetime.now() + timedelta(days=30)
        
        cur.execute(
            "INSERT INTO subscriptions (user_id, is_active, expires_at) VALUES (%s, %s, %s) RETURNING id, is_active, expires_at",
            (user_id, True, expires_at)
        )
        subscription = cur.fetchone()
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({
                'id': subscription[0],
                'is_active': subscription[1],
                'expires_at': subscription[2].isoformat()
            }),
            'isBase64Encoded': False
        }
    
    if method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('user_id')
        is_active = body.get('is_active', False)
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'user_id is required'}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            "UPDATE subscriptions SET is_active = %s, updated_at = CURRENT_TIMESTAMP WHERE user_id = %s RETURNING id, is_active, expires_at",
            (is_active, user_id)
        )
        subscription = cur.fetchone()
        
        conn.commit()
        cur.close()
        conn.close()
        
        if not subscription:
            return {
                'statusCode': 404,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Subscription not found'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({
                'id': subscription[0],
                'is_active': subscription[1],
                'expires_at': subscription[2].isoformat() if subscription[2] else None
            }),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }