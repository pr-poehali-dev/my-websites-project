import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  language?: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  subscription: {
    is_active: boolean;
    expires_at: string | null;
  };
}

const API_AUTH = 'https://functions.poehali.dev/3b902437-10ba-4e3a-8063-cd7a131007f4';
const API_SUBSCRIPTIONS = 'https://functions.poehali.dev/ca27174b-c2ee-4ee8-801e-a51b61124a1c';
const API_GENERATE = 'https://functions.poehali.dev/cc4ac22e-75c4-4e7c-8e50-ae8d28d3817c';

function Index() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'python' | 'lua'>('python');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [showAuthDialog, setShowAuthDialog] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser?.is_admin && showAdminPanel) {
      loadAllUsers();
    }
  }, [currentUser, showAdminPanel]);

  const handleLogin = async () => {
    if (!userEmail) return;
    setIsLoading(true);
    
    try {
      const response = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, name: userName || 'Пользователь' })
      });
      
      const user = await response.json();
      setCurrentUser(user);
      setShowAuthDialog(false);
    } catch (error) {
      alert('Ошибка авторизации');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await fetch(API_SUBSCRIPTIONS);
      const users = await response.json();
      setAllUsers(users);
    } catch (error) {
      console.error('Failed to load users', error);
    }
  };

  const handleGrantSubscription = async (userId: number) => {
    try {
      await fetch(API_SUBSCRIPTIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      await loadAllUsers();
      if (currentUser && currentUser.id === userId) {
        const response = await fetch(API_AUTH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email, name: currentUser.name })
        });
        const updatedUser = await response.json();
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      alert('Ошибка выдачи подписки');
    }
  };

  const handleRevokeSubscription = async (userId: number) => {
    try {
      await fetch(API_SUBSCRIPTIONS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, is_active: false })
      });
      await loadAllUsers();
      if (currentUser && currentUser.id === userId) {
        const response = await fetch(API_AUTH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email, name: currentUser.name })
        });
        const updatedUser = await response.json();
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      alert('Ошибка отзыва подписки');
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    if (!currentUser?.subscription.is_active) {
      alert('Для использования AI необходима подписка! Оформите подписку за 199₽');
      return;
    }

    const userMessage: Message = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(API_GENERATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, language })
      });
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.code,
        language
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Ошибка генерации кода. Проверьте, что добавлен OPENAI_API_KEY.',
        language
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вход в систему</DialogTitle>
            <DialogDescription>
              Введите ваш email для входа
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input 
                id="login-email" 
                type="email" 
                placeholder="your@email.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-name">Имя (необязательно)</Label>
              <Input 
                id="login-name" 
                placeholder="Ваше имя"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-primary to-secondary"
              onClick={handleLogin}
              disabled={!userEmail || isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-8">
        <header className="mb-12 text-center animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-2xl">
              <Icon name="Code2" size={32} className="text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              CodeGen AI
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Генерация кода на Python и Lua с помощью искусственного интеллекта
          </p>
          
          {currentUser && (
            <div className="flex gap-3 justify-center mt-6">
              <div className="text-sm text-muted-foreground">
                Вы вошли как: <span className="font-medium">{currentUser.email}</span>
              </div>
              
              {currentUser.subscription.is_active ? (
                <Badge variant="default" className="px-4 py-2 text-sm bg-gradient-to-r from-primary to-secondary">
                  <Icon name="CheckCircle" size={16} className="mr-2" />
                  Подписка активна
                </Badge>
              ) : (
                <Badge variant="secondary" className="px-4 py-2 text-sm">
                  <Icon name="XCircle" size={16} className="mr-2" />
                  Нет подписки
                </Badge>
              )}
              
              {currentUser.is_admin && (
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                >
                  <Icon name="Shield" size={20} className="mr-2" />
                  Админ-панель
                </Button>
              )}
            </div>
          )}
        </header>

        {showAdminPanel && currentUser?.is_admin && (
          <Card className="mb-8 border-primary/20 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Shield" size={24} />
                Админ-панель
              </CardTitle>
              <CardDescription>Управление подписками пользователей</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4">
                  {allUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.name}
                          {user.is_admin && ' (Администратор)'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {user.subscription.is_active ? (
                          <>
                            <Badge className="bg-gradient-to-r from-primary to-secondary">
                              Активна
                              {user.subscription.expires_at && (
                                <span className="ml-1 text-xs">
                                  до {new Date(user.subscription.expires_at).toLocaleDateString('ru-RU')}
                                </span>
                              )}
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRevokeSubscription(user.id)}
                            >
                              Отозвать
                            </Button>
                          </>
                        ) : (
                          <>
                            <Badge variant="secondary">Подписка неактивна</Badge>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleGrantSubscription(user.id)}
                            >
                              Выдать подписку
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-12 animate-fade-in">
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <Icon name="Zap" size={32} className="text-primary mb-2" />
              <CardTitle>Быстрая генерация</CardTitle>
              <CardDescription>
                Получайте готовый код за секунды
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-secondary/20 hover:border-secondary/40 transition-colors">
            <CardHeader>
              <Icon name="Code" size={32} className="text-secondary mb-2" />
              <CardTitle>Python & Lua</CardTitle>
              <CardDescription>
                Поддержка двух популярных языков
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-accent/20 hover:border-accent/40 transition-colors">
            <CardHeader>
              <Icon name="Brain" size={32} className="text-accent mb-2" />
              <CardTitle>AI-мощность</CardTitle>
              <CardDescription>
                Современные алгоритмы машинного обучения
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="border-primary/20 animate-fade-in">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>AI Генератор кода</CardTitle>
                <CardDescription>Опишите что нужно создать</CardDescription>
              </div>
              <Tabs value={language} onValueChange={(v) => setLanguage(v as 'python' | 'lua')}>
                <TabsList>
                  <TabsTrigger value="python" className="gap-2">
                    <Icon name="FileCode" size={16} />
                    Python
                  </TabsTrigger>
                  <TabsTrigger value="lua" className="gap-2">
                    <Icon name="FileCode2" size={16} />
                    Lua
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ScrollArea className="h-[400px] rounded-lg border p-4 bg-muted/30">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Icon name="MessageSquare" size={48} className="mb-4 opacity-50" />
                    <p>Начните диалог с AI</p>
                    <p className="text-sm">Опишите какой код вам нужен</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-r from-primary to-secondary text-white'
                              : 'bg-muted'
                          }`}
                        >
                          <pre className="whitespace-pre-wrap font-mono text-sm">
                            {msg.content}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="flex gap-2">
                <Textarea
                  placeholder={`Например: "Создай функцию для сортировки массива" (${language})`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="min-h-[80px]"
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  disabled={!input.trim() || isLoading}
                >
                  {isLoading ? (
                    <Icon name="Loader2" size={20} className="animate-spin" />
                  ) : (
                    <Icon name="Send" size={20} />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Index;