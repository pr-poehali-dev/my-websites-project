import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User authentication and admin check
    Args: event with httpMethod, body (email)
    Returns: user data with admin status and subscription info
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body = json.loads(event.get('body', '{}'))
    email = body.get('email', '')
    name = body.get('name', 'Пользователь')
    
    if not email:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Email is required'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    cur.execute(
        "INSERT INTO users (email, name) VALUES (%s, %s) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id, email, name, is_admin",
        (email, name)
    )
    user = cur.fetchone()
    user_id, user_email, user_name, is_admin = user
    
    cur.execute(
        "SELECT is_active, expires_at FROM subscriptions WHERE user_id = %s ORDER BY created_at DESC LIMIT 1",
        (user_id,)
    )
    subscription = cur.fetchone()
    
    conn.commit()
    cur.close()
    conn.close()
    
    result = {
        'id': user_id,
        'email': user_email,
        'name': user_name,
        'is_admin': is_admin,
        'subscription': {
            'is_active': subscription[0] if subscription else False,
            'expires_at': subscription[1].isoformat() if subscription and subscription[1] else None
        }
    }
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps(result),
        'isBase64Encoded': False
    }
